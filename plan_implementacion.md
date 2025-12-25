# Plan de Implementación: Sistema de Playlist + Descarga + ZIP (TypeScript)

## A. Gestión de Playlists con YouTube Data API

### Tecnologías

-   **Frontend:** Next.js, React 19, TypeScript
-   **Backend:** Node.js + TypeScript
-   **API:** Google YouTube Data API v3 (OAuth2)
-   **Paquetes Backend Necesarios**
    -   googleapis
    -   @types/googleapis
    -   express / fastify
    -   dotenv
    -   node-cache (caché opcional)
    -   valibot o zod para validaciones
    -   tanstack-query (frontend)

### Flujo Técnico

1.  Autenticación OAuth2 (client ID + client secret).
2.  Crear playlist usando `youtube.playlists.insert`.
3.  Agregar videos seleccionados usando `playlistItems.insert`.
4.  Reordenar usando `playlistItems.update`.
5.  Eliminar vídeos o playlists usando `playlistItems.delete` o
    `playlists.delete`.

------------------------------------------------------------------------

## B. Descarga de Videos usando yt-dlp (sin API oficial de Google)

### Tecnologías / Paquetes

-   **Biblioteca de descargas:** yt-dlp (CLI o wrapper)
-   **Paquetes Node:**
    -   yt-dlp-exec (wrapper)
    -   node:fs/promises
    -   node:path
    -   node:child_process (opcional; no recomendado)
    -   dayjs (manejo de fechas)
    -   archiver (para generar ZIP)

### Flujo Técnico

1.  Recibir playlistId en el backend.

2.  Obtener los videoIds con YouTube Data API.

3.  Por cada videoId ejecutar:

    ``` bash
    yt-dlp -f "best[height<=720]" https://youtube.com/watch?v=VIDEO_ID -o "./downloads/DATE/VIDEO_ID.mp4"
    ```

4.  Manejar errores de videos bloqueados o eliminados.

5.  Validar la estructura de carpetas por fecha (`YYYY-MM-DD`).

------------------------------------------------------------------------

## C. Generación del ZIP y Descarga en el Frontend

### Paquetes Backend

-   archiver
-   fs-extra
-   path

### Flujo Técnico

1.  Una vez descargados los videos dentro de `/downloads/FECHA/`.

2.  Crear un stream ZIP:

    -   Usar `archiver("zip")`.
    -   Comprimir carpeta completa.

3.  Exponer un endpoint como:

        GET /api/download-playlist/:playlistId

    Que devuelva el ZIP como `application/zip`.

### Ejemplo Conceptual del Flujo Completo

1.  Usuario crea o selecciona una playlist desde el frontend.
2.  Backend consulta el contenido de esa playlist con YouTube Data API.
3.  Backend descarga cada video con yt-dlp (720p).
4.  Backend genera un ZIP con fecha.
5.  Frontend muestra un botón **"Descargar ZIP"** que llama al endpoint.
6.  ZIP se descarga en el ordenador del usuario.

------------------------------------------------------------------------

## Resumen de Paquetes Necesarios

### Backend (Node + TS)

  Paquete             Uso
  ------------------- ----------------------
  googleapis          Acceso a YouTube API
  yt-dlp-exec         Descarga de videos
  archiver            Crear ZIP
  dayjs               Gestión de fechas
  dotenv              Variables de entorno
  fs-extra            Manejo de archivos
  express / fastify   API backend

### Frontend (Next.js + React 19)

  Paquete             Uso
  ------------------- --------------------------
  tanstack-query      Manejo de datos async
  axios o fetch API   Llamadas al backend
  Zustand / Context   Estado global (opcional)

------------------------------------------------------------------------

## Notas Finales

-   La app será privada/personal, por lo que el uso de yt-dlp es
    aceptable.
-   Recomendado implementar colas (BullMQ) si las descargas pueden ser
    pesadas.
