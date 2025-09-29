/**
 * TaskMaster: Lógica de negocio y control de UI
 * ---------------------------------------------
 * Responsabilidad:
 * - Gestionar el estado de las tareas en memoria y coordinar la vista (DOM).
 * - Orquestar llamadas a la capa de datos (window.taskAPI) y renderizar cambios.
 *
 * Decisiones y razones:
 * - Se usa una clase para encapsular el estado y los métodos de interacción.
 * - No se usan módulos ES para permitir ejecución directa con file:// sin CORS.
 * - Se separa la lógica (este archivo) del acceso a datos (api.js) y del arranque (app.js).
 * - Se incluyen utilidades de accesibilidad (aria-labels, escapeHtml).
 *
 * Migración a Tailwind CSS 4.1 (UI):
 * - Render de lista con utilidades Tailwind (flex, gap, rounded, bg, border, etc.).
 * - Notificaciones con clases Tailwind y transiciones (translate-y, opacity).
 * - Overlay con utilidades hidden/flex y animate-spin.
 * - Tema claro/oscuro con clase 'dark' en <html>, preferencia persistida en localStorage.
 * - Filtros con alternancia de clases bg-primary/text-white vs transparente.
 * - Se preservan IDs y data-attributes para no romper la lógica existente.
 */
/**
 * Administrador de tareas: maneja estado, eventos y renderizado.
 */
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.init();
    }

    /**
     * Inicializa la app: carga datos, dibuja la vista y vincula eventos.
     * @returns {Promise<void>}
     */
    async init() {
        await this.loadTasks();
        this.renderTasks();
        this.setupEventListeners();
    }

    /**
     * Carga todas las tareas desde la API y actualiza contador.
     * @returns {Promise<void>}
     */
    async loadTasks() {
        try {
            this.tasks = await window.taskAPI.getTasks();
            this.renderTaskCount();
        } catch (error) {
            this.showNotification('Error al cargar las tareas', 'error');
        }
    }

    /**
     * Crea una nueva tarea con el texto indicado.
     * @param {string} text - Contenido de la tarea.
     * @returns {Promise<object|undefined>} Tarea creada o undefined si hay error/validación.
     */
    async addTask(text) {
        if (!text.trim()) return;

        try {
            const newTask = await window.taskAPI.addTask({ text });
            this.tasks.unshift(newTask);
            this.renderTasks();
            this.showNotification('Tarea agregada correctamente');
            return newTask;
        } catch (error) {
            this.showNotification('Error al agregar la tarea', 'error');
            console.error(error);
        }
    }

    /**
     * Alterna el estado de completado de una tarea.
     * @param {string} id - Identificador de la tarea.
     * @returns {Promise<void>}
     */
    async toggleTaskCompletion(id) {
        try {
            const task = this.tasks.find(t => t.id === id);
            if (!task) return;

            const updatedTask = await window.taskAPI.updateTask(id, { 
                completed: !task.completed 
            });
            
            const index = this.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                this.tasks[index] = updatedTask;
                this.renderTasks();
            }
        } catch (error) {
            this.showNotification('Error al actualizar la tarea', 'error');
            console.error(error);
        }
    }

    /**
     * Actualiza el texto de una tarea.
     * @param {string} id - Identificador de la tarea.
     * @param {string} newText - Nuevo contenido.
     * @returns {Promise<void>}
     */
    async updateTaskText(id, newText) {
        if (!newText.trim()) return;

        try {
            const updatedTask = await window.taskAPI.updateTask(id, { 
                text: newText 
            });
            
            const index = this.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                this.tasks[index] = updatedTask;
                this.renderTasks();
                this.showNotification('Tarea actualizada correctamente');
            }
        } catch (error) {
            this.showNotification('Error al actualizar la tarea', 'error');
            console.error(error);
        }
    }

    /**
     * Elimina una tarea por id.
     * @param {string} id - Identificador de la tarea a eliminar.
     * @returns {Promise<void>}
     */
    async deleteTask(id) {
        try {
            await window.taskAPI.deleteTask(id);
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.renderTasks();
            this.showNotification('Tarea eliminada correctamente');
        } catch (error) {
            this.showNotification('Error al eliminar la tarea', 'error');
            console.error(error);
        }
    }

    /**
     * Elimina todas las tareas marcadas como completadas.
     * @returns {Promise<void>}
     */
    async clearCompletedTasks() {
        try {
            const remainingTasks = await window.taskAPI.clearCompleted();
            this.tasks = remainingTasks;
            this.renderTasks();
            this.showNotification('Tareas completadas eliminadas');
        } catch (error) {
            this.showNotification('Error al eliminar tareas completadas', 'error');
            console.error(error);
        }
    }

    /**
     * Cambia el filtro activo (all | pending | completed) y vuelve a renderizar.
     * @param {('all'|'pending'|'completed')} filter
     */
    filterTasks(filter) {
        this.currentFilter = filter;
        this.renderTasks();
    }

    /**
     * Devuelve las tareas según el filtro activo.
     * @returns {Array<object>}
     */
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return [...this.tasks];
        }
    }

    /**
     * Renderiza la lista de tareas en el DOM y vincula eventos por ítem.
     * 
     * Implementación con Tailwind CSS:
     * - Cada tarea es un <li> con clases: flex, items-center, gap-4, p-4
     * - Fondo adaptativo: bg-white dark:bg-gray-800
     * - Bordes: border border-gray-200 dark:border-gray-700
     * - Animación de entrada: animate-[fadeIn_0.3s_ease-out]
     * - Estado completado: opacity-70, line-through, text-gray-500
     * - Botones de acción con hover effects y colores contextuales
     * 
     * @returns {void}
     */
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();

        // Estado vacío con utilidades Tailwind
        if (filteredTasks.length === 0) {
            const emptyState = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-clipboard-list text-5xl mb-4 opacity-50"></i>
                    <p>No hay tareas ${this.currentFilter !== 'all' ? this.currentFilter : ''}</p>
                </div>
            `;
            taskList.innerHTML = emptyState;
            this.renderTaskCount();
            return;
        }

        // Renderizar cada tarea con estructura Tailwind
        // Clases principales: flex (layout), gap-4 (espaciado), p-4 (padding)
        // Tema adaptativo: bg-white/dark:bg-gray-800, border-gray-200/dark:border-gray-700
        taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 animate-[fadeIn_0.3s_ease-out] ${task.completed ? 'opacity-70' : ''}" data-id="${task.id}">
                <input 
                    type="checkbox" 
                    class="task-checkbox w-5 h-5 cursor-pointer accent-primary" 
                    ${task.completed ? 'checked' : ''}
                    aria-label="Marcar como ${task.completed ? 'pendiente' : 'completada'}"
                >
                <span class="task-text flex-1 break-words ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}">${this.escapeHtml(task.text)}</span>
                <div class="task-actions flex gap-2">
                    <button class="edit-btn p-2 text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition" aria-label="Editar tarea">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn p-2 text-gray-500 dark:text-gray-400 hover:text-secondary hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition" aria-label="Eliminar tarea">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `).join('');

        this.renderTaskCount();
        this.setupTaskEventListeners();
    }

    /**
     * Muestra el resumen (pendientes/total) en la barra de estado.
     */
    renderTaskCount() {
        const taskCount = document.getElementById('taskCount');
        const pendingTasks = this.tasks.filter(task => !task.completed).length;
        const totalTasks = this.tasks.length;

        if (totalTasks === 0) {
            taskCount.textContent = 'No hay tareas';
        } else if (pendingTasks === 0) {
            taskCount.textContent = `¡Todas las tareas completadas! (${totalTasks})`;
        } else {
            taskCount.textContent = `${pendingTasks} de ${totalTasks} tarea${totalTasks !== 1 ? 's' : ''} pendiente${pendingTasks !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Muestra una notificación temporal en pantalla usando Tailwind.
     * 
     * Sistema de notificaciones (Toast):
     * - Clases base: fixed, bottom-8, right-8, px-6, py-4, rounded-lg, shadow-lg
     * - Transiciones: transition-all duration-300
     * - Estados:
     *   * Oculto: translate-y-32 opacity-0
     *   * Visible: translate-y-0 opacity-100
     * - Colores contextuales:
     *   * Éxito: bg-green-500 text-white
     *   * Error: bg-red-500 text-white
     * 
     * @param {string} message - Texto de la notificación.
     * @param {'success'|'error'} [type='success'] - Tipo de mensaje (afecta estilos).
     * @returns {void}
     */
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        
        // Clases base + contextuales Tailwind
        const baseClasses = 'fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 z-50';
        const typeClasses = type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white';
        const visibleClasses = 'translate-y-0 opacity-100';
        const hiddenClasses = 'translate-y-32 opacity-0';
        
        notification.className = `${baseClasses} ${typeClasses} ${visibleClasses}`;

        setTimeout(() => {
            notification.className = `${baseClasses} ${typeClasses} ${hiddenClasses}`;
        }, 3000);
    }

    /**
     * Registra los eventos de alto nivel de la interfaz (botones, filtros, tema).
     */
    setupEventListeners() {
        // Añadir tarea al hacer clic en el botón
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            const input = document.getElementById('taskInput');
            this.addTask(input.value);
            input.value = '';
        });

        // Añadir tarea al presionar Enter
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask(e.target.value);
                e.target.value = '';
            }
        });

        // Filtros - Alternancia de estado activo con clases Tailwind
        // Botón activo: bg-primary text-white border-primary
        // Botón inactivo: bg-transparent text-gray-900 dark:text-gray-100
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const filter = target.dataset.filter;
                this.filterTasks(filter);
                
                // Actualizar estilos con Tailwind
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('bg-primary', 'text-white', 'border-primary');
                    b.classList.add('bg-transparent', 'text-gray-900', 'dark:text-gray-100');
                });
                target.classList.remove('bg-transparent', 'text-gray-900', 'dark:text-gray-100');
                target.classList.add('bg-primary', 'text-white', 'border-primary');
            });
        });

        // Limpiar tareas completadas
        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompletedTasks();
        });

        // DEMO: Sembrar datos con Fetch API
        const seedFetchBtn = document.getElementById('seedFetch');
        if (seedFetchBtn) {
            seedFetchBtn.addEventListener('click', async () => {
                try {
                    this.setDemoLoading(true, { running: 'fetch' });
                    const count = parseInt(document.getElementById('seedCount')?.value || '5', 10);
                    const seeded = await window.taskAPI.seedFromFetch(count);
                    this.tasks = seeded;
                    this.renderTasks();
                    this.showNotification('Tareas sembradas con Fetch');
                } catch (err) {
                    this.showNotification('Error al sembrar con Fetch', 'error');
                    console.error(err);
                } finally {
                    this.setDemoLoading(false);
                }
            });
        }

        // DEMO: Sembrar datos con XMLHttpRequest (AJAX clásico)
        const seedXHRBtn = document.getElementById('seedXHR');
        if (seedXHRBtn) {
            seedXHRBtn.addEventListener('click', async () => {
                try {
                    this.setDemoLoading(true, { running: 'xhr' });
                    const count = parseInt(document.getElementById('seedCount')?.value || '5', 10);
                    const seeded = await window.taskAPI.seedFromXHR(count);
                    this.tasks = seeded;
                    this.renderTasks();
                    this.showNotification('Tareas sembradas con XHR');
                } catch (err) {
                    this.showNotification('Error al sembrar con XHR', 'error');
                    console.error(err);
                } finally {
                    this.setDemoLoading(false);
                }
            });
        }

        // DEMO: Vaciar todas las tareas
        const clearAllBtn = document.getElementById('clearAll');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', async () => {
                if (!confirm('¿Seguro que deseas eliminar TODAS las tareas?')) return;
                try {
                    await window.taskAPI.saveTasks([]);
                    this.tasks = [];
                    this.renderTasks();
                    this.showNotification('Todas las tareas fueron eliminadas');
                } catch (err) {
                    this.showNotification('Error al vaciar todas las tareas', 'error');
                    console.error(err);
                }
            });
        }

        // Tema oscuro/claro (Tailwind dark mode con clase 'dark')
        // Tailwind detecta la clase 'dark' en <html> para aplicar variantes dark:
        // Configuración en index.html: tailwind.config = { darkMode: 'class' }
        // Persistencia: localStorage guarda 'theme' = 'light' | 'dark'
        // Detección automática: prefers-color-scheme si no hay preferencia guardada
        const themeToggle = document.getElementById('themeToggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Cargar preferencia guardada o usar la del sistema
        const currentTheme = localStorage.getItem('theme');
        const initialDark = currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches);
        if (initialDark) {
            document.documentElement.classList.add('dark');
            themeToggle.checked = true;
        } else {
            document.documentElement.classList.remove('dark');
            themeToggle.checked = false;
        }

        // Cambiar tema y persistir preferencia
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    /**
     * Activa/desactiva estado de carga para los controles de la barra DEMO.
     * 
     * Overlay con Tailwind:
     * - Alternancia entre clases 'hidden' (display: none) y 'flex' (display: flex)
     * - El overlay tiene: fixed inset-0 bg-black/20 backdrop-blur-sm
     * - Spinner con: animate-spin (rotación continua)
     * 
     * @param {boolean} loading - true para mostrar overlay, false para ocultar
     * @param {{running?: 'fetch'|'xhr'}} [opts] - Opciones para indicar qué operación está corriendo
     * @returns {void}
     */
    setDemoLoading(loading, opts = {}) {
        const seedFetchBtn = document.getElementById('seedFetch');
        const seedXHRBtn = document.getElementById('seedXHR');
        const seedCountSel = document.getElementById('seedCount');
        const clearAllBtn = document.getElementById('clearAll');
        const overlay = document.getElementById('loadingOverlay');

        if (seedCountSel) seedCountSel.disabled = loading;
        if (clearAllBtn) clearAllBtn.disabled = loading;

        if (seedFetchBtn) {
            seedFetchBtn.disabled = loading;
            seedFetchBtn.dataset.originalText = seedFetchBtn.dataset.originalText || seedFetchBtn.textContent;
            seedFetchBtn.textContent = loading && opts.running === 'fetch' ? 'Sembrando… (Fetch)' : seedFetchBtn.dataset.originalText;
        }

        if (seedXHRBtn) {
            seedXHRBtn.disabled = loading;
            seedXHRBtn.dataset.originalText = seedXHRBtn.dataset.originalText || seedXHRBtn.textContent;
            seedXHRBtn.textContent = loading && opts.running === 'xhr' ? 'Sembrando… (XHR)' : seedXHRBtn.dataset.originalText;
        }

        // Mostrar/ocultar overlay de carga (Tailwind utilities)
        if (overlay) {
            if (loading) {
                overlay.classList.remove('hidden');
                overlay.classList.add('flex');
                overlay.setAttribute('aria-hidden', 'false');
            } else {
                setTimeout(() => {
                    overlay.classList.remove('flex');
                    overlay.classList.add('hidden');
                    overlay.setAttribute('aria-hidden', 'true');
                }, 150);
            }
        }
    }

    /**
     * Registra eventos específicos por elemento de tarea (checkbox, editar, eliminar).
     */
    setupTaskEventListeners() {
        // Marcar tarea como completada
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.toggleTaskCompletion(taskId);
            });
        });

        // Editar tarea
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                const taskId = taskItem.dataset.id;
                const task = this.tasks.find(t => t.id === taskId);
                const taskText = taskItem.querySelector('.task-text');
                
                // Crear input de edición con clases Tailwind
                // - w-full: ancho completo
                // - px-3 py-2: padding horizontal y vertical
                // - border con colores adaptativos al tema
                // - focus:outline-none focus:ring-2 focus:ring-primary: anillo de foco
                const input = document.createElement('input');
                input.type = 'text';
                input.value = task.text;
                input.className = 'edit-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary';
                
                // Reemplazar el texto con el input
                taskText.replaceWith(input);
                input.focus();
                input.select();
                
                const saveEdit = () => {
                    const newText = input.value.trim();
                    if (newText && newText !== task.text) {
                        this.updateTaskText(taskId, newText);
                    } else {
                        this.renderTasks();
                    }
                };
                
                input.addEventListener('blur', saveEdit);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    } else if (e.key === 'Escape') {
                        this.renderTasks();
                    }
                });
            });
        });

        // Eliminar tarea
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                    this.deleteTask(taskId);
                }
            });
        });
    }

    /**
     * Escapa caracteres peligrosos para evitar inyección de HTML en la vista.
     * @param {string} unsafe - Texto potencialmente inseguro.
     * @returns {string} - Texto seguro para insertar en el DOM.
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Exponer en el ámbito global para scripts clásicos
window.TaskManager = TaskManager;
