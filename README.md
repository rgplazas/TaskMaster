# TaskMaster (HTML + Bulma v1.0.4 + JavaScript)

[![Educational Project](https://img.shields.io/badge/educational-project-blue)](#)
[![Bulma](https://img.shields.io/badge/Bulma-v1.0.4-00d1b2)](#)

Este proyecto es un gestor de tareas moderno y didáctico que demuestra tres formas de trabajar con datos en el navegador usando Bulma v1.0.4 para el diseño responsive:

- Local (sin red): usando `localStorage` con API asíncrona simulada.
- Fetch API: pidiendo datos a un endpoint público (JSONPlaceholder).
- AJAX clásico (XMLHttpRequest): la forma tradicional previa a Fetch.

La aplicación está pensada para que un alumno pueda leer el código y entender el “por qué” de cada decisión. Incluye documentación en todos los archivos y comentarios JSDoc en la lógica JavaScript.

---

## Estructura del proyecto

```
TaskMaster/
├─ index.html                # Estructura semántica, Bulma v1.0.4 y carga de scripts
└─ js/
   ├─ api.js                 # Capa de datos (localStorage, Fetch, XHR)
   ├─ taskManager.js         # Lógica de negocio y render de UI
   └─ app.js                 # Arranque de la aplicación
```

**Nota:** Este proyecto utiliza **únicamente Bulma v1.0.4** desde CDN para todos los estilos. No hay archivos CSS personalizados, solo estilos inline mínimos en el `<head>` del HTML para funcionalidad específica (notificaciones, loading overlay, estados de tareas).

---

## Filosofía y separación de responsabilidades

- `index.html`
  - Utiliza **SOLO Bulma v1.0.4** desde CDN para todos los estilos y componentes.
  - Implementa el sistema de clases de Bulma (container, box, field, button, notification, level) para un layout responsive.
  - Usa componentes nativos de Bulma: box, field has-addons, button, level, notification.
  - Incluye estilos inline mínimos (`<style>`) solo para funcionalidad específica que Bulma no cubre.
  - Define la estructura semántica (header, main, lista de tareas) y una barra de demostración.

- `js/api.js`
  - Encapsula todo el acceso a datos con una API asíncrona: obtener, guardar, añadir, actualizar y eliminar tareas.
  - Simula latencia de red para acostumbrar a trabajar con `async/await` y posibles retardos.
  - Expone métodos de "semilla" para traer datos de ejemplo de un endpoint público con `fetch()` o con `XMLHttpRequest`.
  - Se publica una instancia global `window.taskAPI` para scripts clásicos.

- `js/taskManager.js`
  - Clase `TaskManager` que gestiona estado, eventos y render del DOM.
  - Maneja filtros, edición en línea, eliminación, contador y notificaciones.
  - Implementa la barra de demostración y un overlay de carga mientras se ejecutan Fetch/XHR.
  - Se publica la clase como `window.TaskManager`.

- `js/app.js`
  - Punto de entrada: espera a `DOMContentLoaded`, crea una instancia de `TaskManager` y la expone en `window.taskManager` para depurar.

---

## Cómo ejecutar

1. Abre `index.html` con doble clic (se abrirá con `file://`).
2. Añade tareas, márcalas como completadas, edítalas o elimínalas.
3. Prueba la barra de demostración:
   - Elige la "Cantidad" (3/5/10).
   - Pulsa "Sembrar (Fetch)" o "Sembrar (XHR)". Si hay Internet y CORS permitido (JSONPlaceholder normalmente lo permite), se cargarán tareas de ejemplo.
   - "Vaciar todo" borra todas las tareas en `localStorage`.

Notas:
- Todo persiste en `localStorage` del navegador, por lo que al recargar seguirás viendo tus tareas.
- Si Fetch/XHR falla (sin red o bloqueo), la app sigue funcionando con los datos locales.

---

## Conceptos clave (para alumnos)

- **Bulma v1.0.4:** Framework CSS profesional que proporciona clases utility y componentes UI responsive sin necesidad de CSS personalizado extenso.
- **Asincronía:** Todos los métodos de la "API" son `async` y devuelven `Promise`, para reflejar el mundo real (servidores que tardan en responder). Esto te obliga a usar `await` y a manejar errores.
- **Diseño en capas:** Separar **vista** (HTML/Bulma), **lógica** (TaskManager) y **datos** (API) facilita pruebas, mantenimiento y escalabilidad.
- **Accesibilidad:** Bulma incluye características de accesibilidad por defecto. Se respetan estados de foco, hay etiquetas `aria-label` en controles, y se evita inyectar HTML no escapado (`escapeHtml`).
- **Persistencia local:** `localStorage` permite guardar el estado sin servidores.
- **Compatibilidad:** Evitar ES Modules en `file://` evita errores CORS y hace que el proyecto funcione "al abrir y listo".
- **Sin dependencias locales:** Todo se carga desde CDN (Bulma, Font Awesome), no hay archivos CSS ni librerías adicionales que instalar.

---

## Flujo principal

{{ ... }}
1. `app.js` crea `new window.TaskManager()` cuando el DOM está listo.
2. `TaskManager.init()` carga tareas desde `taskAPI.getTasks()`, dibuja la lista y configura los eventos.
3. Al añadir/editar/completar/eliminar, `TaskManager` llama a `taskAPI` y luego vuelve a renderizar.
4. La barra de demo puede “sembrar” con `Fetch` o `XHR`, y muestra un overlay de carga durante la operación.

---

## Diagramas de secuencia

### 1) CRUD de tareas

#### 1.1 Añadir una tarea (localStorage)
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)
    participant API as taskAPI (localStorage)

    U->>UI: Click "Añadir" o Enter (texto)
    UI->>UI: Validar texto (no vacío)
    UI->>API: addTask({ text })
    API-->>API: getTasks() / saveTasks()
    API-->>UI: Tarea creada
    UI->>UI: Agrega tarea a this.tasks (unshift)
    UI->>UI: renderTasks()
    UI->>UI: showNotification()
```

#### 1.2 Cambiar estado completado/pendiente
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)
    participant API as taskAPI (localStorage)

    U->>UI: Click en checkbox de la tarea
    UI->>UI: Buscar tarea por id en this.tasks
    UI->>API: updateTask(id, { completed: !task.completed })
    API-->>API: getTasks() / saveTasks()
    API-->>UI: Tarea actualizada
    UI->>UI: this.tasks[index] = updatedTask
    UI->>UI: renderTasks()
```

#### 1.3 Edición inline de una tarea (texto)
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)
    participant API as taskAPI (localStorage)

    U->>UI: Click botón "Editar"
    UI->>UI: Reemplazar <span> por <input> y enfocar
    alt Guardar (Enter o blur)
        UI->>UI: newText = input.value.trim()
        UI->>API: updateTask(id, { text: newText })
        API-->>API: getTasks() / saveTasks()
        API-->>UI: Tarea actualizada
        UI->>UI: this.tasks[index] = updatedTask
        UI->>UI: renderTasks()
        UI->>UI: showNotification()
    else Cancelar (Escape) o sin cambios
        UI->>UI: renderTasks() (restaurar vista)
    end
```

#### 1.4 Eliminar una tarea
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)
    participant API as taskAPI (localStorage)

    U->>UI: Click botón "Eliminar"
    UI->>U: confirm("¿Eliminar?")
    alt Usuario confirma
        UI->>API: deleteTask(id)
        API-->>API: getTasks() / saveTasks(filtered)
        API-->>UI: OK
        UI->>UI: this.tasks = this.tasks.filter(t => t.id !== id)
        UI->>UI: renderTasks()
        UI->>UI: showNotification()
    else Usuario cancela
        UI->>UI: Sin cambios
    end
```

### 2) Filtrado por estado
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)

    U->>UI: Click filtro (all | pending | completed)
    UI->>UI: currentFilter = filter
    UI->>UI: getFilteredTasks()
    UI-->>UI: Lista filtrada
    UI->>UI: renderTasks()
    UI->>UI: renderTaskCount()
```

### 3) Operaciones masivas

#### 3.1 Limpiar tareas completadas
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)
    participant API as taskAPI (localStorage)

    U->>UI: Click "Limpiar completadas"
    UI->>API: clearCompleted()
    API-->>API: getTasks() / saveTasks(only pending)
    API-->>UI: remainingTasks
    UI->>UI: this.tasks = remainingTasks
    UI->>UI: renderTasks()
    UI->>UI: showNotification()
```

#### 3.2 Vaciar todas las tareas (barra de demostración)
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)
    participant API as taskAPI (localStorage)

    U->>UI: Click "Vaciar todo"
    UI->>U: confirm("¿Eliminar TODAS las tareas?")
    alt Usuario confirma
        UI->>API: saveTasks([])
        API-->>UI: OK
        UI->>UI: this.tasks = []
        UI->>UI: renderTasks()
        UI->>UI: showNotification()
    else Usuario cancela
        UI->>UI: Sin cambios
    end
```

#### 3.3 Completar todas las tareas (opcional)
Nota: Método disponible en taskAPI.completeAll(); no existe botón en la UI por defecto.
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)
    participant API as taskAPI (localStorage)

    U->>UI: Click "Completar todas"
    UI->>API: completeAll()
    API-->>API: getTasks() / saveTasks(completed = true)
    API-->>UI: updatedTasks
    UI->>UI: this.tasks = updatedTasks
    UI->>UI: renderTasks()
    UI->>UI: showNotification()
```

### 4) Demostración: Sembrar con Fetch o XHR
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM (TaskManager)
    participant API as taskAPI (fetch/xhr)
    participant NET as JSONPlaceholder

    U->>UI: Click "Sembrar (Fetch/XHR)"
    UI->>UI: setDemoLoading(true)
    UI->>API: seedFromFetch/seedFromXHR(limit)
    NET-->>API: 200 OK (JSON)
    API-->>API: map() -> saveTasks()
    API-->>UI: Lista sembrada
    UI->>UI: Actualiza this.tasks con lista sembrada
    UI->>UI: renderTasks()
    UI->>UI: showNotification()
    UI->>UI: setDemoLoading(false)
```
- `seedFromFetch(limit)` → `Promise<array>` (requiere red)
- `seedFromXHR(limit)` → `Promise<array>` (requiere red)

### 5) Auxiliares

#### 5.1 Diagrama de estados de una tarea
```mermaid
stateDiagram-v2
    [*] --> Pendiente: addTask(text)
    Pendiente --> Completada: toggleTaskCompletion()
    Completada --> Pendiente: toggleTaskCompletion()
    Pendiente --> Editando: click Editar
    Completada --> Editando: click Editar
    Editando --> Pendiente: guardar cambios / cancelar
    Editando --> Completada: guardar cambios / cancelar
    Pendiente --> Eliminada: deleteTask()
    Completada --> Eliminada: deleteTask()
    Eliminada --> [*]
```

#### 5.2 Diagrama de clases (simplificado)
```mermaid
classDiagram
    class TaskManager {
      - tasks: Array
      - currentFilter: all|pending|completed
      + init()
      + loadTasks()
      + addTask(text)
      + toggleTaskCompletion(id)
      + updateTaskText(id, newText)
      + deleteTask(id)
      + clearCompletedTasks()
      + filterTasks(filter)
      + getFilteredTasks()
      + renderTasks()
      + renderTaskCount()
      + showNotification(message, type)
      + setupEventListeners()
      + setupTaskEventListeners()
      + setDemoLoading(loading, opts)
      + escapeHtml(unsafe)
    }
    class TaskAPI {
      + getTasks()
      + saveTasks(tasks)
      + addTask(text)
      + updateTask(id, updates)
      + deleteTask(id)
      + clearCompleted()
      + completeAll()
      + seedFromFetch(limit)
      + seedFromXHR(limit)
    }
    TaskManager --> TaskAPI : usa
```

#### 5.3 Mapa de eventos de UI (resumen)
```mermaid
flowchart TD
    A[Click Añadir / Enter] -->|#addTaskBtn / #taskInput| B[TaskManager.addTask]
    C[Click checkbox] -->|.task-checkbox| D[TaskManager.toggleTaskCompletion]
    E[Click Editar] -->|.edit-btn| F[TaskManager.updateTaskText]
    G[Click Eliminar] -->|.delete-btn| H[TaskManager.deleteTask]
    I[Click filtro] -->|.filter-btn| J[TaskManager.filterTasks and renderTasks]
    K[Click Limpiar completadas] -->|#clearCompleted| L[TaskManager.clearCompletedTasks]
    M[Click Sembrar Fetch] -->|#seedFetch| N[taskAPI.seedFromFetch and setDemoLoading]
    O[Click Sembrar XHR] -->|#seedXHR| P[taskAPI.seedFromXHR and setDemoLoading]
    Q[Click Vaciar todo] -->|#clearAll| R[taskAPI.saveTasks empty and renderTasks]
```

## Buenas prácticas visibles en el código

- Escapado de HTML en `TaskManager.escapeHtml()`.
- Estados de carga y deshabilitado de controles en operaciones asíncronas.
- Contador de tareas y filtros que no dependen de cómo llegan los datos.
- Comentarios JSDoc y de secciones que explican el “por qué”.

---
- Prioridades de tareas
  - Objetivo: Añadir un campo `priority` (low|medium|high) y un selector al crear/editar.
  - Pistas: Extiende el objeto de tarea en `api.js` y ajusta el render en `taskManager.js`. Usa clases CSS para colorear etiquetas.

- Búsqueda por texto
  - Objetivo: Filtrar tareas en tiempo real por coincidencia parcial en `text`.
  - Pistas: Añade un input de búsqueda y filtra sobre `this.tasks` antes de `renderTasks()`.

  - Objetivo: Permitir descargar las tareas como `.json` y volver a cargarlas.
  - Pistas: `JSON.stringify(this.tasks)` + `URL.createObjectURL(new Blob(...))` para exportar; `FileReader` para importar y luego `taskAPI.saveTasks()`.

- Confirmación visual de eliminación
  - Objetivo: Reemplazar `confirm()` por un toast/dialog no bloqueante.
  - Pistas: Crea un mini componente con HTML/CSS, y resuelve la promesa cuando el usuario confirma/cancela.

- Tests (si usas un entorno con Node)
  - Objetivo: Añadir unit tests a `TaskManager` (métodos puros) y pruebas de interacción DOM.
    - Pistas: `jest` + `@testing-library/dom` o Playwright para flujos E2E.

---

## Glosario (para alumnos)

- Asincronía: Operaciones que tardan (red, disco) sin bloquear la UI. En JS se maneja con Promesas y async/await.
- Promise: Objeto que representa el resultado futuro de una operación asincrónica (éxito o error).
- DOM: Representación del documento HTML como árbol de nodos; permite manipular la interfaz desde JS.
- CORS: Política que regula el acceso entre orígenes distintos; en file:// los navegadores restringen módulos y lecturas locales.
- Fetch API: Interfaz moderna para peticiones HTTP basada en Promesas.
- XMLHttpRequest (XHR): API clásica de AJAX previa a Fetch, basada en eventos/callbacks.
- localStorage: Almacenamiento clave-valor persistente en el navegador; útil para demos sin servidor.
- ARIA: Atributos de accesibilidad para mejorar la experiencia con tecnologías de asistencia (ej. aria-label).
- :focus-visible: Pseudoclase CSS que muestra el foco al navegar con teclado sin molestar al uso con mouse.


- Fetch/XHR fallan (sin red o endpoint caído)
  - Síntoma: Notificación de error al “Sembrar”.
  - Verifica: Conexión a Internet, consola del navegador, endpoint accesible.
  - Alternativa: La app sigue funcionando con `localStorage` sin sembrar.

- No persisten las tareas
  - Síntoma: Al recargar, desaparecen las tareas.
  - Causa: el navegador puede estar en modo incógnito bloqueando `localStorage`.
  - Solución: Usar ventana normal o permitir almacenamiento local.

- Overlay no se muestra
  - Síntoma: No ves el spinner durante Fetch/XHR.
  - Causa: Clase `.show` no aplicada o CSS no cargado.
  - Solución: Revisa `setDemoLoading()` en `taskManager.js` y la sección de CSS del overlay.
