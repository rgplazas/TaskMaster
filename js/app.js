/**
 * TaskMaster: Punto de entrada (bootstrap)
 * ---------------------------------------
 * Responsabilidad:
 * - Esperar al DOM y crear la instancia principal de la app.
 * - Exponer la instancia para depuración si es necesario (window.taskManager).
 *
 * Decisiones y razones:
 * - Mantener este archivo mínimo para separar responsabilidades:
 *   - app.js: arranque
 *   - taskManager.js: lógica de negocio y UI
 *   - api.js: acceso a datos (localStorage simulado)
 */
// Inicializar la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Crear una instancia del administrador de tareas usando el ámbito global
    const taskManager = new window.TaskManager();

    // Hacer el administrador de tareas accesible globalmente para depuración
    window.taskManager = taskManager;

    // Mostrar un mensaje de bienvenida
    setTimeout(() => {
        taskManager.showNotification('¡Bienvenido a TaskMaster! Empieza añadiendo tus tareas.');
    }, 1000);
});
