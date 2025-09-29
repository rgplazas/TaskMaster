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
 * - Se incluyen utilidades de accesibilidad (focus-visible, aria-labels, escapeHtml).
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
     */
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            const emptyState = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No hay tareas ${this.currentFilter !== 'all' ? this.currentFilter : ''}</p>
                </div>
            `;
            taskList.innerHTML = emptyState;
            this.renderTaskCount();
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    aria-label="Marcar como ${task.completed ? 'pendiente' : 'completada'}"
                >
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="edit-btn" aria-label="Editar tarea">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" aria-label="Eliminar tarea">
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
     * Muestra una notificación temporal en pantalla.
     * @param {string} message - Texto de la notificación.
     * @param {'success'|'error'} [type='success'] - Tipo de mensaje (afecta estilos).
     */
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
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

        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterTasks(filter);
                
                // Actualizar botones activos
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
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

        // Tema oscuro/claro - DESHABILITADO (solo Foundation v6.9)
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // El toggle está oculto con CSS, no hacer nada
        }
    }

    /**
     * Activa/desactiva estado de carga para los controles de la barra DEMO.
     * Cambia texto de botones, deshabilita controles y actualiza cursores.
     * @param {boolean} loading
     * @param {{running?: 'fetch'|'xhr'}} [opts]
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

        // Mostrar/ocultar overlay de carga
        if (overlay) {
            if (loading) {
                overlay.classList.add('show');
                overlay.setAttribute('aria-hidden', 'false');
            } else {
                // Pequeño retraso para evitar parpadeo
                setTimeout(() => {
                    overlay.classList.remove('show');
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
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = task.text;
                input.className = 'edit-input';
                
                // Aplicar estilos al input
                input.style.width = '100%';
                input.style.padding = '0.5rem';
                input.style.border = '1px solid var(--border-color)';
                input.style.borderRadius = '4px';
                input.style.backgroundColor = 'var(--card-bg)';
                input.style.color = 'var(--text-primary)';
                
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
