# Plan de Implementación: Playlist Manager

## Estado Actual
- Proyecto completamente vacío (solo documentación)
- Directorios `backend/` y `frontend/` existen pero están vacíos
- Sin código, sin dependencias, sin configuración

## Stack Tecnológico Definido
- **Backend:** Fastify + TypeScript + Node.js
- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Validación:** Valibot
- **HTTP Client:** Axios
- **State Management:** TanStack Query
- **Job Queue:** Post-MVP (no en versión inicial)

---

## Fase 0: Bootstrapping y Configuración Base

### Objetivos
Crear la estructura base del monorepo con configuraciones funcionales.

### Tareas

1. **Configuración del Monorepo**
   - Crear `package.json` raíz con workspaces
   - Configurar scripts para ejecutar backend y frontend simultáneamente
   - Crear `.gitignore` completo

2. **Setup Backend**
   - Inicializar `backend/package.json`
   - Instalar: `fastify`, `@fastify/cors`, `typescript`, `tsx`, `@types/node`
   - Crear `backend/tsconfig.json` con configuración para Node.js
   - Crear servidor Fastify básico con health check
   - Configurar hot-reload con `tsx`

3. **Setup Frontend**
   - Ejecutar `npx create-next-app@latest frontend` con TypeScript
   - Configurar `next.config.js` (proxy para evitar CORS)
   - Instalar TanStack Query y configurar QueryClientProvider
   - Crear layout base y página de inicio

4. **Variables de Entorno**
   - Crear `backend/.env.example` con variables necesarias
   - Crear `frontend/.env.example`
   - Configurar `dotenv` en backend

### Archivos Críticos
```
package.json (root)
backend/package.json
backend/src/server.ts
backend/tsconfig.json
backend/.env.example
frontend/package.json
frontend/src/app/layout.tsx
frontend/src/app/providers.tsx
.gitignore
```

### Validación
- ✓ `npm run dev` inicia ambos servidores
- ✓ Backend responde en `GET /health` → 200 OK
- ✓ Frontend muestra página inicial
- ✓ Variables de entorno se cargan correctamente

---

## Fase 1: Autenticación OAuth2 con YouTube

### Objetivos
Implementar flujo completo de OAuth2 con Google/YouTube API.

### Tareas

1. **Configuración Google Cloud**
   - Documentar pasos para crear proyecto en Google Cloud Console
   - Habilitar YouTube Data API v3
   - Crear credenciales OAuth2
   - Configurar redirect URI: `http://localhost:[PORT]/api/auth/google/callback`

2. **Servicio de Autenticación**
   - Instalar: `googleapis`
   - Crear `backend/src/services/youtube-auth.service.ts`
   - Inicializar OAuth2Client de googleapis
   - Implementar almacenamiento de tokens (archivo JSON en `backend/tokens/`)
   - Implementar refresh automático de tokens

3. **Endpoints de Autenticación**
   - `GET /api/auth/login` - Genera URL de autorización
   - `GET /api/auth/google/callback` - Maneja callback de OAuth
   - `GET /api/auth/status` - Verifica estado de autenticación
   - `POST /api/auth/logout` - Limpia tokens

4. **Middleware de Autenticación**
   - Crear `backend/src/middlewares/auth.middleware.ts`
   - Validar presencia y validez de tokens
   - Adjuntar cliente autenticado al contexto de request
   - Manejar refresh transparente de tokens

### Archivos Críticos
```
backend/src/services/youtube-auth.service.ts
backend/src/routes/auth.routes.ts
backend/src/middlewares/auth.middleware.ts
backend/src/types/auth.types.ts
backend/tokens/.gitkeep
backend/.env (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET)
```

### Validación
- ✓ Flujo OAuth completa exitosamente en navegador
- ✓ Tokens se guardan en sistema de archivos
- ✓ Endpoints protegidos rechazan requests sin auth
- ✓ Refresh automático funciona cuando token expira

---

## Fase 2: API de Gestión de Playlists

### Objetivos
CRUD completo de playlists usando YouTube Data API v3.

### Tareas

1. **Servicio YouTube API**
   - Crear `backend/src/services/youtube-api.service.ts`
   - Wrapper para googleapis con manejo de errores
   - Métodos:
     - `getUserPlaylists()` - Listar playlists del usuario
     - `createPlaylist(title, description, privacy)` - Crear playlist
     - `updatePlaylist(playlistId, updates)` - Actualizar metadata
     - `deletePlaylist(playlistId)` - Eliminar playlist
     - `getPlaylistItems(playlistId)` - Obtener videos
     - `addVideoToPlaylist(playlistId, videoId)` - Agregar video
     - `removeVideoFromPlaylist(playlistItemId)` - Quitar video
     - `reorderPlaylistItem(playlistItemId, position)` - Reordenar

2. **Validación con Valibot**
   - Instalar: `valibot`
   - Crear `backend/src/schemas/playlist.schema.ts`
   - Definir schemas para request/response
   - Integrar validación en rutas

3. **Endpoints RESTful**
   - `GET /api/playlists` - Listar playlists
   - `POST /api/playlists` - Crear playlist
   - `GET /api/playlists/:id` - Detalle de playlist
   - `PATCH /api/playlists/:id` - Actualizar playlist
   - `DELETE /api/playlists/:id` - Eliminar playlist
   - `GET /api/playlists/:id/items` - Obtener videos
   - `POST /api/playlists/:id/items` - Agregar video
   - `DELETE /api/playlists/:id/items/:itemId` - Quitar video
   - `PATCH /api/playlists/:id/items/:itemId` - Reordenar

4. **Manejo de Errores**
   - Crear `backend/src/utils/error-handler.ts`
   - Manejar errores de YouTube API (quota, not found, permisos)
   - Formato consistente de respuestas de error

### Archivos Críticos
```
backend/src/services/youtube-api.service.ts
backend/src/routes/playlist.routes.ts
backend/src/schemas/playlist.schema.ts
backend/src/types/playlist.types.ts
backend/src/utils/error-handler.ts
```

### Validación
- ✓ Listar playlists del usuario vía API
- ✓ Crear, actualizar y eliminar playlists
- ✓ Agregar/quitar videos de playlists
- ✓ Reordenar videos dentro de playlist
- ✓ Errores retornan formato consistente

---

## Fase 3: Servicio de Descarga de Videos

### Objetivos
Descargar videos usando yt-dlp con organización por fecha.

### Tareas

1. **Instalación y Configuración yt-dlp**
   - Instalar: `yt-dlp-exec`, `dayjs`, `fs-extra`
   - Verificar que yt-dlp esté instalado en sistema
   - Configurar opciones de descarga (720p max)

2. **Servicio de Descarga**
   - Crear `backend/src/services/download.service.ts`
   - Método `downloadVideo(videoId, outputPath)`:
     - Formato: `best[height<=720]`
     - Manejo de progreso
     - Error handling para videos bloqueados/eliminados
   - Crear `backend/src/utils/file-system.utils.ts`:
     - Estructura de carpetas: `./downloads/YYYY-MM-DD/VIDEO_ID.mp4`
     - Usar dayjs para formateo de fechas
     - Limpieza de descargas fallidas

3. **Manager de Descargas**
   - Crear `backend/src/services/download-manager.service.ts`
   - Tracking en memoria: `Map<downloadId, DownloadStatus>`
   - Descargas secuenciales para MVP (sin queue)
   - Continuar descargando si un video falla
   - Registrar videos exitosos y fallidos

4. **Endpoints de Descarga**
   - `POST /api/downloads/start` - Iniciar descarga de playlist
     - Body: `{ playlistId: string }`
     - Retorna: `{ downloadId: string }`
   - `GET /api/downloads/:downloadId/status` - Estado de descarga
     - Retorna: progreso, videos descargados, errores

### Archivos Críticos
```
backend/src/services/download.service.ts
backend/src/services/download-manager.service.ts
backend/src/routes/download.routes.ts
backend/src/utils/file-system.utils.ts
backend/src/types/download.types.ts
backend/.env (DOWNLOAD_PATH)
```

### Validación
- ✓ Descargar un video individual a carpeta con fecha
- ✓ Descargar playlist completa
- ✓ Videos bloqueados/eliminados no rompen el proceso
- ✓ Tracking de progreso funciona correctamente
- ✓ Videos descargados son reproducibles y en 720p

---

## Fase 4: Generación y Streaming de ZIP

### Objetivos
Crear archivos ZIP de videos descargados y transmitirlos al cliente.

### Tareas

1. **Servicio ZIP**
   - Instalar: `archiver`
   - Crear `backend/src/services/zip.service.ts`
   - Implementar streaming de ZIP (evitar cargar todo en memoria)
   - Incluir todos los videos de una sesión de descarga
   - Manejo de errores de archiver

2. **Endpoint ZIP**
   - `GET /api/downloads/:downloadId/zip` - Generar y descargar ZIP
     - Headers: `Content-Type: application/zip`
     - Filename: `playlist-{title}-{date}.zip`
     - Streaming directo a response
     - Manejar desconexión de cliente

3. **Limpieza Post-Descarga** (Opcional)
   - Variable de entorno: `CLEANUP_AFTER_ZIP=true/false`
   - Eliminar archivos fuente después de crear ZIP exitosamente
   - Solo si ZIP se completa sin errores

### Archivos Críticos
```
backend/src/services/zip.service.ts
backend/src/routes/download.routes.ts (actualizar)
backend/src/types/zip.types.ts
backend/.env (CLEANUP_AFTER_ZIP)
```

### Validación
- ✓ ZIP se genera correctamente con todos los videos
- ✓ ZIP se descarga en navegador con nombre correcto
- ✓ Contenido del ZIP es válido y reproducible
- ✓ Playlists grandes (10+ videos) no causan problemas de memoria
- ✓ Limpieza funciona si está habilitada

---

## Fase 5: Frontend - Autenticación y Estructura

### Objetivos
Configurar estructura base del frontend e implementar flujo de autenticación.

### Tareas

1. **Estructura de Proyecto**
   - Configurar App Router de Next.js:
     - `frontend/src/app/layout.tsx` - Layout principal
     - `frontend/src/app/page.tsx` - Landing page
     - `frontend/src/app/playlists/page.tsx` - Lista de playlists
     - `frontend/src/app/playlists/[id]/page.tsx` - Detalle de playlist
   - Crear carpetas: `components/`, `hooks/`, `services/`, `types/`

2. **Cliente API**
   - Instalar: `axios`
   - Crear `frontend/src/services/api.service.ts`
   - Configurar axios con base URL
   - Interceptor de request para headers auth
   - Interceptor de response para manejo de errores
   - Métodos tipados para cada endpoint

3. **Configuración TanStack Query**
   - Instalar: `@tanstack/react-query`
   - Configurar QueryClient en `frontend/src/app/providers.tsx`
   - Opciones: staleTime, cacheTime, retry
   - QueryClientProvider envolviendo la app

4. **UI de Autenticación**
   - Crear `frontend/src/components/AuthButton.tsx`
   - Crear `frontend/src/hooks/useAuth.ts`
   - Verificar estado de auth al cargar app
   - Botón "Login with Google" cuando no autenticado
   - Info de usuario y "Logout" cuando autenticado
   - Manejar redirect después de OAuth callback

5. **Layout y Navegación**
   - Header con navegación
   - Estados de carga (skeletons)
   - Error boundaries
   - Diseño responsive básico

### Archivos Críticos
```
frontend/src/app/layout.tsx
frontend/src/app/providers.tsx
frontend/src/services/api.service.ts
frontend/src/components/AuthButton.tsx
frontend/src/hooks/useAuth.ts
frontend/src/types/api.types.ts
frontend/next.config.js
```

### Validación
- ✓ Flujo OAuth completa desde frontend
- ✓ Estado de autenticación persiste en refresh
- ✓ Rutas protegidas redirigen a login
- ✓ UI responsive se ve bien en desktop y mobile

---

## Fase 6: Frontend - Gestión de Playlists

### Objetivos
Construir UI completa para crear, editar y gestionar playlists.

### Tareas

1. **Vista de Lista de Playlists**
   - Página: `frontend/src/app/playlists/page.tsx`
   - Componente: `frontend/src/components/PlaylistCard.tsx`
   - Hook: `frontend/src/hooks/usePlaylists.ts`
   - Mostrar thumbnails, títulos, conteo de videos
   - Botón "Create Playlist"
   - Búsqueda/filtrado
   - Loading skeletons

2. **Crear Playlist**
   - Modal: `frontend/src/components/CreatePlaylistModal.tsx`
   - Hook: `frontend/src/hooks/useCreatePlaylist.ts`
   - Campos: title, description, privacy
   - Validación con Valibot (mirror de backend)
   - Mutation de TanStack Query
   - Optimistic updates
   - Notificaciones de éxito/error

3. **Vista de Detalle de Playlist**
   - Página: `frontend/src/app/playlists/[id]/page.tsx`
   - Hook: `frontend/src/hooks/usePlaylistDetail.ts`
   - Mostrar metadata de playlist
   - Lista de videos con thumbnails
   - Información de videos (duración, fecha)
   - Botón "Download Playlist"

4. **Acciones de Gestión**
   - Editar playlist (modal similar a crear)
   - Eliminar playlist (con confirmación)
   - Agregar video por URL o video ID
   - Quitar videos de playlist
   - Reordenar videos (drag-and-drop con `dnd-kit`)

5. **Custom Hooks**
   - `frontend/src/hooks/usePlaylists.ts` - Query para lista
   - `frontend/src/hooks/usePlaylistDetail.ts` - Query para detalle
   - `frontend/src/hooks/useCreatePlaylist.ts` - Mutation crear
   - `frontend/src/hooks/useUpdatePlaylist.ts` - Mutation actualizar
   - `frontend/src/hooks/useDeletePlaylist.ts` - Mutation eliminar

### Archivos Críticos
```
frontend/src/app/playlists/page.tsx
frontend/src/app/playlists/[id]/page.tsx
frontend/src/components/PlaylistCard.tsx
frontend/src/components/CreatePlaylistModal.tsx
frontend/src/components/VideoList.tsx
frontend/src/hooks/usePlaylists.ts
frontend/src/hooks/usePlaylistDetail.ts
frontend/src/hooks/useCreatePlaylist.ts
frontend/src/types/playlist.types.ts
```

### Validación
- ✓ Ver todas las playlists en grid/lista
- ✓ Crear nuevas playlists exitosamente
- ✓ Editar metadata de playlists
- ✓ Eliminar playlists con confirmación
- ✓ Agregar/quitar videos
- ✓ Reordenar videos con drag-and-drop
- ✓ Optimistic updates funcionan correctamente

---

## Fase 7: Frontend - Descarga y ZIP

### Objetivos
Implementar UI para descargar videos y generar archivos ZIP.

### Tareas

1. **Iniciar Descarga**
   - Componente: `frontend/src/components/DownloadButton.tsx`
   - Hook: `frontend/src/hooks/useDownload.ts`
   - Botón en página de detalle de playlist
   - Modal de confirmación con info de descarga
   - Llamar a `POST /api/downloads/start`
   - Guardar downloadId en estado

2. **Progreso de Descarga**
   - Componente: `frontend/src/components/DownloadProgress.tsx`
   - Hook: `frontend/src/hooks/useDownloadStatus.ts`
   - Polling de status cada 2-3 segundos
   - Barra de progreso con porcentaje
   - Video actual siendo descargado
   - Contadores: exitosos/fallidos
   - Lista de videos fallidos con razones

3. **Descarga de ZIP**
   - Mostrar botón "Download ZIP" al completar
   - Trigger descarga: `GET /api/downloads/:downloadId/zip`
   - Manejar descarga de archivos grandes
   - Notificación de descarga completa

4. **Historial de Descargas** (Opcional para MVP)
   - Guardar en localStorage
   - Mostrar descargas pasadas
   - Opción de re-descargar

5. **Manejo de Errores**
   - Mensajes claros para fallos
   - Indicar qué videos fallaron y por qué
   - Opción de reintentar
   - Manejar interrupciones de red

### Archivos Críticos
```
frontend/src/components/DownloadButton.tsx
frontend/src/components/DownloadProgress.tsx
frontend/src/hooks/useDownload.ts
frontend/src/hooks/useDownloadStatus.ts
frontend/src/types/download.types.ts
```

### Validación
- ✓ Iniciar descarga de playlist
- ✓ Progreso en tiempo real se actualiza
- ✓ Descarga completa muestra resumen
- ✓ ZIP se descarga correctamente en navegador
- ✓ Videos fallidos se muestran claramente
- ✓ Reintentos funcionan correctamente

---

## Fase 8: Testing y Robustez

### Objetivos
Agregar tests y mejorar manejo de errores.

### Tareas

1. **Backend Testing**
   - Instalar: `vitest`, `@vitest/ui`
   - Crear `backend/vitest.config.ts`
   - Unit tests para servicios (mock googleapis, yt-dlp-exec, archiver)
   - Tests de endpoints con mocks
   - Tests de flujo OAuth
   - Tests de escenarios de error

2. **Frontend Testing**
   - Instalar: `vitest`, `@testing-library/react`, `@testing-library/react-hooks`
   - Crear `frontend/vitest.config.ts`
   - Tests de componentes clave
   - Tests de hooks
   - Mock de API con MSW
   - Tests de estados de carga y error

3. **Error Handling Mejorado**
   - Global error handler para excepciones no capturadas
   - Logging estructurado (considerar Pino para Fastify)
   - Error boundaries en React
   - Retry logic para fallos transitorios
   - Mensajes de error amigables al usuario

4. **Edge Cases**
   - Playlists vacías
   - Playlists con 100+ videos
   - Videos eliminados/privados/bloqueados
   - Timeouts de red
   - Espacio en disco insuficiente
   - Múltiples requests concurrentes

### Archivos Críticos
```
backend/vitest.config.ts
backend/src/__tests__/services/youtube-api.service.test.ts
backend/src/__tests__/services/download.service.test.ts
frontend/vitest.config.ts
frontend/src/__tests__/components/PlaylistCard.test.tsx
frontend/src/__tests__/hooks/usePlaylists.test.ts
```

### Validación
- ✓ Tests pasan con >80% cobertura
- ✓ Escenarios de error manejados correctamente
- ✓ Logs proveen información útil para debug
- ✓ Usuarios reciben mensajes claros y accionables

---

## Fase 9: Producción y Documentación

### Objetivos
Preparar aplicación para uso real y documentar el proyecto.

### Tareas

1. **Optimización de Performance**
   - Paginación para listas largas
   - Virtual scrolling para muchos videos
   - Análisis de bundle size de Next.js
   - Caché de respuestas de API
   - Considerar SQLite para historial de descargas (opcional)

2. **Configuración de Producción**
   - Variables de entorno para producción
   - Configurar CORS apropiadamente
   - Rate limiting (`@fastify/rate-limit`)
   - Request logging
   - Security headers (`@fastify/helmet`)
   - Configurar PM2 o Docker para deployment

3. **Documentación**
   - README.md completo en raíz
   - Instrucciones de setup
   - Documentar variables de entorno
   - Guía de OAuth setup en Google Cloud
   - Documentar proceso de deployment
   - API documentation (considerar Fastify Swagger)

4. **UI Polish**
   - Transiciones y animaciones
   - Mejores loading states
   - Dark mode (opcional)
   - Toast notifications
   - Keyboard shortcuts
   - Mejorar responsive en mobile

5. **Monitoring** (Opcional)
   - Health checks adicionales
   - Métricas de aplicación
   - Error tracking (Sentry)

### Archivos Críticos
```
README.md
backend/README.md
frontend/README.md
backend/src/server.ts (config producción)
frontend/next.config.js (optimizaciones)
docker-compose.yml (opcional)
.github/workflows/ci.yml (opcional)
```

### Validación
- ✓ App funciona con 50+ playlists
- ✓ Build completa sin errores
- ✓ Configuración de producción funciona
- ✓ Documentación clara y completa
- ✓ Mejores prácticas de seguridad implementadas

---

## Fase 10: Features Avanzados (Post-MVP)

Funcionalidades para implementar después del MVP:

1. **Job Queue con BullMQ**
   - Redis + BullMQ para descargas en background
   - Workers para procesar descargas
   - Priorización y scheduling de jobs

2. **Base de Datos**
   - PostgreSQL o SQLite
   - Historial de descargas persistente
   - Caché de metadata de playlists
   - Preferencias de usuario

3. **Features Adicionales**
   - Descargas programadas
   - Import/export de playlists
   - Selección de formato (audio-only, diferentes resoluciones)
   - Operaciones batch (múltiples playlists)
   - Preview de videos antes de descargar
   - Compartir playlists con otros usuarios

4. **UI Avanzada**
   - Búsqueda y filtrado avanzado
   - Analytics de playlists
   - Customización de thumbnails
   - Edición masiva

---

## Dependencias entre Fases

```
Fase 0 (Setup)
    ↓
Fase 1 (OAuth Backend)
    ↓
Fase 2 (Playlist API Backend)
    ↓
Fase 3 (Download Service) ──-┐
    ↓                        │
Fase 4 (ZIP Service)         │
    ↓                        │
Fase 5 (Frontend Auth) ──────┘
    ↓
Fase 6 (Playlist UI)
    ↓
Fase 7 (Download UI)
    ↓
Fase 8 (Testing) ← Continuo en todas las fases
    ↓
Fase 9 (Producción)
    ↓
Fase 10 (Features Avanzados)
```

**Trabajo en Paralelo:**
- Fase 3 + 4 pueden trabajarse en paralelo si interfaces están definidas
- Fase 5 puede empezar cuando Fase 1 esté completa
- Testing (Fase 8) debe ser continuo durante todas las fases

---

## Checklist de Testing Manual

- [ ] OAuth flow completa exitosamente
- [ ] Crear/editar/eliminar playlists
- [ ] Agregar/quitar/reordenar videos
- [ ] Descargar video individual
- [ ] Descargar playlist completa
- [ ] Generar y descargar ZIP
- [ ] Manejar videos bloqueados/eliminados
- [ ] Probar con playlist grande (20+ videos)
- [ ] Probar en múltiples navegadores
- [ ] Probar responsive en mobile

---

## Resumen de Decisiones Técnicas

| Categoría | Tecnología | Razón |
|-----------|------------|-------|
| Backend Framework | Fastify | Mejor TypeScript, performance, plugins modernos |
| Validación | Valibot | Más ligero, sintaxis similar a Zod |
| Frontend HTTP | Axios | Interceptores, mejor manejo de errores |
| State Management | TanStack Query | Async state, caché automático, optimistic updates |
| Job Queue | Post-MVP | Empezar simple, escalar después |
| Autenticación | OAuth2 | Requerido por YouTube API |
| Descargas | yt-dlp-exec | Wrapper Node.js para yt-dlp |
| ZIP | archiver | Streaming, evita problemas de memoria |

---

## Próximos Pasos Inmediatos

1. **Comenzar Fase 0:**
   - Crear package.json raíz con workspaces
   - Inicializar backend con Fastify
   - Inicializar frontend con Next.js
   - Configurar variables de entorno

2. **Setup Google Cloud:**
   - Crear proyecto en Google Cloud Console
   - Habilitar YouTube Data API v3
   - Obtener credenciales OAuth2

3. **Comenzar desarrollo siguiendo el orden de fases**

---

## Notas Importantes

- Este es un proyecto **personal/privado** - uso de yt-dlp es aceptable
- Videos se descargan a máximo **720p**
- Estructura de carpetas: `./downloads/YYYY-MM-DD/VIDEO_ID.mp4`
- OAuth tokens necesitan **refresh automático**
- **Error handling** es crítico para videos bloqueados/eliminados
- MVP no incluye job queues - descargas síncronas inicialmente
