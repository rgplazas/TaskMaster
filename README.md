# TaskMaster (HTML + CSS + JavaScript puro)

[![Educational Project](https://img.shields.io/badge/educational-project-blue)](#)

Este proyecto es un gestor de tareas moderno y didáctico que demuestra tres formas de trabajar con datos en el navegador sin frameworks ni Node:

- Local (sin red): usando `localStorage` con API asíncrona simulada.
- Fetch API: pidiendo datos a un endpoint público (JSONPlaceholder).
- AJAX clásico (XMLHttpRequest): la forma tradicional previa a Fetch.

La aplicación está pensada para que un alumno pueda leer el código y entender el “por qué” de cada decisión. Incluye documentación en todos los archivos y comentarios JSDoc en la lógica JavaScript.

---

## Estructura del proyecto

```
TaskMaster/
├─ index.html                # Estructura semántica y carga de scripts
├─ css/
│  └─ styles.css             # Estilos, temas y accesibilidad
└─ js/
   ├─ api.js                 # Capa de datos (localStorage, Fetch, XHR)
   ├─ taskManager.js         # Lógica de negocio y render de UI
   └─ app.js                 # Arranque de la aplicación
```

---

## Filosofía y separación de responsabilidades

- `index.html`
  - Define la estructura semántica (header, main, lista de tareas) y una barra de demostración (sembrar datos por Fetch/XHR y vaciar).
  - Carga scripts “clásicos” en orden: primero la capa de datos (`api.js`), luego la lógica (`taskManager.js`) y, por último, el arranque (`app.js`).
  - ¿Por qué clásico y no ES Modules? Al abrir por `file://`, los navegadores pueden bloquear módulos ES por CORS. Evitamos servidores externos para mantener la consigna “solo HTML/CSS/JS”.

- `css/styles.css`
  - Usa variables CSS (paleta, bordes, sombras, transiciones) y un modo oscuro controlado por `[data-theme="dark"]`.
  - Estilo minimalista: preferimos bordes sutiles y buen contraste, con atención a accesibilidad (`:focus-visible`).
  - Incluye un overlay de carga con spinner para las demostraciones Fetch/XHR.

- `js/api.js`
  - Encapsula todo el acceso a datos con una API asíncrona: obtener, guardar, añadir, actualizar y eliminar tareas.
  - Simula latencia de red para acostumbrar a trabajar con `async/await` y posibles retardos.
  - Expone métodos de “semilla” para traer datos de ejemplo de un endpoint público con `fetch()` o con `XMLHttpRequest`.
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
   - Elige la “Cantidad” (3/5/10).
   - Pulsa “Sembrar (Fetch)” o “Sembrar (XHR)”. Si hay Internet y CORS permitido (JSONPlaceholder normalmente lo permite), se cargarán tareas de ejemplo.
   - “Vaciar todo” borra todas las tareas en `localStorage`.

Notas:
- Todo persiste en `localStorage` del navegador, por lo que al recargar seguirás viendo tus tareas.
- Si Fetch/XHR falla (sin red o bloqueo), la app sigue funcionando con los datos locales.

---

## Conceptos clave (para alumnos)

- Asincronía: Todos los métodos de la “API” son `async` y devuelven `Promise`, para reflejar el mundo real (servidores que tardan en responder). Esto te obliga a usar `await` y a manejar errores.
- Diseño en capas: Separar **vista** (HTML/CSS), **lógica** (TaskManager) y **datos** (API) facilita pruebas, mantenimiento y escalabilidad.
- Accesibilidad: se respetan estados de foco, hay etiquetas `aria-label` en controles, y se evita inyectar HTML no escapado (`escapeHtml`).
- Persistencia local: `localStorage` permite guardar el estado sin servidores.
- Compatibilidad: evitar ES Modules en `file://` evita errores CORS y hace que el proyecto funcione “al abrir y listo”.

---

## Flujo principal

1. `app.js` crea `new window.TaskManager()` cuando el DOM está listo.
2. `TaskManager.init()` carga tareas desde `taskAPI.getTasks()`, dibuja la lista y configura los eventos.
3. Al añadir/editar/completar/eliminar, `TaskManager` llama a `taskAPI` y luego vuelve a renderizar.
4. La barra de demo puede “sembrar” con `Fetch` o `XHR`, y muestra un overlay de carga durante la operación.

---

## Diagramas de secuencia

### Añadir una tarea (localStorage)

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

### Sembrar con Fetch o XHR

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
    UI->>UI: showNotification
    UI->>UI: setDemoLoading(false)
```

### Filtrado de tareas (flowchart)

```mermaid
flowchart TD
    A[Click filter] --> B{Filter}
    B -->|all| C[Clone tasks]
    B -->|pending| D[Filter pending]
    B -->|completed| E[Filter completed]
    C --> F[renderTasks]
    D --> F
    E --> F
    F --> G[renderTaskCount]
```

### Edición inline de una tarea (sequence)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as DOM TaskManager
    participant API as taskAPI

    U->>UI: Click Edit button
    UI->>UI: Replace text with input
    U->>UI: Edit and press Enter or lose focus
    UI->>API: updateTask(id, { text })
    API-->>UI: Task updated
    UI->>UI: Update this.tasks[index]
    UI->>UI: renderTasks
    UI->>UI: showNotification
- `getTasks()` → `Promise<array>`
- `saveTasks(tasks)` → `Promise<boolean>`
- `addTask({ text })` → `Promise<object>`
- `updateTask(id, updates)` → `Promise<object>`
- `deleteTask(id)` → `Promise<boolean>`
- `clearCompleted()` → `Promise<array>`
- `seedFromFetch(limit)` → `Promise<array>` (requiere red)
- `seedFromXHR(limit)` → `Promise<array>` (requiere red)

---

## Buenas prácticas visibles en el código

- Escapado de HTML en `TaskManager.escapeHtml()`.
- Estados de carga y deshabilitado de controles en operaciones asíncronas.
- Contador de tareas y filtros que no dependen de cómo llegan los datos.
- Comentarios JSDoc y de secciones que explican el “por qué”.

---

## Ideas de ejercicios guiados

- Prioridades de tareas
  - Objetivo: Añadir un campo `priority` (low|medium|high) y un selector al crear/editar.
  - Pistas: Extiende el objeto de tarea en `api.js` y ajusta el render en `taskManager.js`. Usa clases CSS para colorear etiquetas.

- Búsqueda por texto
  - Objetivo: Filtrar tareas en tiempo real por coincidencia parcial en `text`.
  - Pistas: Añade un input de búsqueda y filtra sobre `this.tasks` antes de `renderTasks()`.

- Exportar/Importar JSON
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
