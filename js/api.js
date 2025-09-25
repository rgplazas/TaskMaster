/**
 * TaskMaster: Capa de datos (API simulada)
 * ----------------------------------------
 * Responsabilidad:
 * - Centralizar todas las operaciones de persistencia (lectura/escritura) de tareas.
 * - Exponer una interfaz asíncrona (similar a una API REST) usando localStorage.
 *
 * Decisiones y razones:
 * - Se simula latencia de red para probar la UI con llamadas asíncronas reales.
 * - Se expone una instancia global (window.taskAPI) para funcionar con scripts clásicos
 *   (sin ES Modules), evitando CORS al abrir por file://.
 * - Métodos basados en Promises para escalar a una API real sin cambiar la UI.
 *
 * Nota de seguridad:
 * - Esta capa no sanea HTML; la vista escapa el texto (ver TaskManager.escapeHtml).
 */
// Simulación de una API con localStorage
class TaskAPI {
    constructor() {
        this.STORAGE_KEY = 'tasks';
    }

    // Obtener todas las tareas
    /**
     * Obtiene todas las tareas desde localStorage.
     * @returns {Promise<Array<{id:string,text:string,completed:boolean,createdAt:string,updatedAt?:string}>>}
     */
    async getTasks() {
        try {
            const tasks = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
            // Simular retraso de red
            await this._simulateNetworkDelay();
            return tasks;
        } catch (error) {
            console.error('Error al obtener tareas:', error);
            throw error;
        }
    }

    // Guardar todas las tareas
    /**
     * Persiste el arreglo completo de tareas en localStorage.
     * @param {Array<object>} tasks - Lista de tareas a guardar.
     * @returns {Promise<boolean>} - true si se guarda correctamente.
     */
    async saveTasks(tasks) {
        try {
            // Simular retraso de red
            await this._simulateNetworkDelay();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error al guardar tareas:', error);
            throw error;
        }
    }

    // Añadir una nueva tarea
    /**
     * Crea una nueva tarea y la inserta al inicio de la lista.
     * @param {{text:string}} task - Objeto con el texto de la tarea.
     * @returns {Promise<object>} - La tarea creada.
     */
    async addTask(task) {
        const tasks = await this.getTasks();
        const newTask = {
            id: Date.now().toString(),
            text: task.text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.unshift(newTask);
        await this.saveTasks(tasks);
        return newTask;
    }

    // Actualizar una tarea existente
    /**
     * Actualiza una tarea existente encontrándola por id.
     * @param {string} id - Identificador de la tarea.
     * @param {Partial<{text:string,completed:boolean}>} updates - Campos a actualizar.
     * @returns {Promise<object>} - La tarea actualizada.
     */
    async updateTask(id, updates) {
        const tasks = await this.getTasks();
        const index = tasks.findIndex(task => task.id === id);
        
        if (index === -1) {
            throw new Error('Tarea no encontrada');
        }

        const updatedTask = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
        tasks[index] = updatedTask;
        await this.saveTasks(tasks);
        return updatedTask;
    }

    // Eliminar una tarea
    /**
     * Elimina una tarea por id.
     * @param {string} id - Identificador de la tarea a eliminar.
     * @returns {Promise<boolean>} - true si se elimina.
     */
    async deleteTask(id) {
        const tasks = await this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== id);
        await this.saveTasks(filteredTasks);
        return true;
    }

    // Marcar todas las tareas como completadas
    /**
     * Marca todas las tareas como completadas.
     * @returns {Promise<Array<object>>} - Lista de tareas actualizadas.
     */
    async completeAll() {
        const tasks = await this.getTasks();
        const updatedTasks = tasks.map(task => ({
            ...task,
            completed: true,
            updatedAt: new Date().toISOString()
        }));
        await this.saveTasks(updatedTasks);
        return updatedTasks;
    }

    // Eliminar todas las tareas completadas
    /**
     * Elimina todas las tareas que ya están completadas.
     * @returns {Promise<Array<object>>} - Lista de tareas restantes.
     */
    async clearCompleted() {
        const tasks = await this.getTasks();
        const filteredTasks = tasks.filter(task => !task.completed);
        await this.saveTasks(filteredTasks);
        return filteredTasks;
    }

    // Simular retraso de red
    /**
     * Simula una latencia de red aleatoria (100-400ms).
     * @private
     * @returns {Promise<void>}
     */
    _simulateNetworkDelay() {
        return new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    }

    // =========================
    // Semillas remotas (DEMO)
    // =========================
    /**
     * Sembrar datos de ejemplo usando Fetch API (GET JSONPlaceholder)
     * Nota: Requiere conexión y que el endpoint permita CORS.
     * @param {number} [limit=5]
     * @returns {Promise<Array<object>>} Lista de tareas sembradas
     */
    async seedFromFetch(limit = 5) {
        const url = `https://jsonplaceholder.typicode.com/todos?_limit=${encodeURIComponent(limit)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        const data = await resp.json();
        const mapped = data.map(item => ({
            id: `${Date.now()}-${item.id}`,
            text: item.title,
            completed: Boolean(item.completed),
            createdAt: new Date().toISOString(),
        }));
        await this.saveTasks(mapped);
        return mapped;
    }

    /**
     * Sembrar datos de ejemplo usando XMLHttpRequest (AJAX clásico)
     * Nota: Requiere conexión y que el endpoint permita CORS.
     * @param {number} [limit=5]
     * @returns {Promise<Array<object>>} Lista de tareas sembradas
     */
    seedFromXHR(limit = 5) {
        const url = `https://jsonplaceholder.typicode.com/todos?_limit=${encodeURIComponent(limit)}`;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = async () => {
                if (xhr.readyState !== 4) return;
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        const mapped = data.map(item => ({
                            id: `${Date.now()}-${item.id}`,
                            text: item.title,
                            completed: Boolean(item.completed),
                            createdAt: new Date().toISOString(),
                        }));
                        await this.saveTasks(mapped);
                        resolve(mapped);
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`XHR failed: ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error('XHR network error'));
            xhr.send();
        });
    }
}
window.taskAPI = new TaskAPI();
