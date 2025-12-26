# Plan de Implementación: Fase 5 - Frontend Autenticación y Estructura

## Contexto

**Estado Actual del Proyecto:**
- ✅ **Backend Completo (Fases 0-4):**
  - OAuth2 con YouTube implementado
  - API de Gestión de Playlists funcionando
  - Servicio de descarga con `ytdlp-nodejs`
  - Generación y streaming de ZIP completado

- ✅ **Frontend Base:**
  - Next.js 15 + React 19 + TypeScript configurado
  - TanStack Query v5 instalado y configurado
  - Axios configurado con interceptores
  - API service con endpoints stubbed
  - App Router estructura básica

- ⚠️ **Frontend Faltante:**
  - Tipos TypeScript (auth, playlist, download)
  - Hooks de TanStack Query
  - Componentes de UI
  - Páginas funcionales
  - Flujo OAuth completo

## Objetivo de la Fase 5

Implementar la estructura completa del frontend y el flujo de autenticación OAuth2 con YouTube, permitiendo al usuario:
1. Iniciar sesión con Google/YouTube
2. Ver su estado de autenticación
3. Cerrar sesión
4. Tener una base sólida para las fases 6 y 7 (gestión de playlists y descargas)

---

## Arquitectura de Autenticación

### Flujo OAuth2 del Usuario

```
1. Usuario hace clic en "Login with Google"
   ↓
2. Frontend llama: GET /api/auth/login
   ↓
3. Backend retorna: { success: true, authUrl: "..." }
   ↓
4. Frontend redirige a authUrl (Google OAuth consent screen)
   ↓
5. Usuario autoriza en Google
   ↓
6. Google redirige a: GET /api/auth/google/callback (backend)
   ↓
7. Backend guarda tokens y redirige a: http://localhost:3000?auth=success
   ↓
8. Frontend detecta ?auth=success y verifica estado: GET /api/auth/status
   ↓
9. Backend retorna: { authenticated: true, user: {...} }
   ↓
10. Usuario autenticado - redirigir a /playlists
```

### Manejo de Estado
- **Server-side:** Backend maneja tokens OAuth (ya implementado)
- **Client-side:** TanStack Query para cachear estado de autenticación
- **Persistencia:** No guardar tokens en frontend (seguridad)
- **Verificación:** Polling periódico o verificación al montar

---

## Tareas de Implementación

### 1. Definir Tipos TypeScript (`frontend/src/types/`)

#### Archivo: `frontend/src/types/auth.types.ts`

```typescript
export interface AuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
    name?: string;
    picture?: string;
  };
  expiresAt?: number; // Token expiry timestamp
}

export interface LoginResponse {
  success: boolean;
  authUrl: string;
  message: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}
```

#### Archivo: `frontend/src/types/api.types.ts`

```typescript
// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

// Pagination (for future use)
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

#### Archivo: `frontend/src/types/playlist.types.ts`

```typescript
export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  itemCount: number;
  privacy: 'public' | 'private' | 'unlisted';
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration?: string;
  position: number;
  publishedAt: string;
}

export interface CreatePlaylistInput {
  title: string;
  description?: string;
  privacy: 'public' | 'private' | 'unlisted';
}

export interface UpdatePlaylistInput {
  title?: string;
  description?: string;
  privacy?: 'public' | 'private' | 'unlisted';
}
```

#### Archivo: `frontend/src/types/download.types.ts`

```typescript
export interface DownloadStatus {
  downloadId: string;
  playlistId: string;
  playlistTitle: string;
  status: 'initializing' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  totalVideos: number;
  completedVideos: number;
  failedVideos: number;
  skippedVideos: number;
  currentVideoIndex: number;
  currentVideo?: VideoDownloadInfo;
  videos: VideoDownloadInfo[];
  downloadPath: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface VideoDownloadInfo {
  videoId: string;
  videoTitle: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'skipped';
  progress: number;
  error?: string;
  filePath?: string;
  fileSize?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface StartDownloadInput {
  playlistId: string;
}

export interface StartDownloadResponse {
  downloadId: string;
  message: string;
  statusUrl: string;
}
```

---

### 2. Implementar API Service Real (`frontend/src/services/api.service.ts`)

**Actualizar el archivo existente:**

**Auth Endpoints:**
```typescript
export const api = {
  auth: {
    async login(): Promise<LoginResponse> {
      const response = await apiClient.get<LoginResponse>('/api/auth/login');
      return response.data;
    },

    async status(): Promise<AuthStatus> {
      const response = await apiClient.get<AuthStatus>('/api/auth/status');
      return response.data;
    },

    async logout(): Promise<LogoutResponse> {
      const response = await apiClient.post<LogoutResponse>('/api/auth/logout');
      return response.data;
    },
  },

  // Playlists endpoints will be implemented in Phase 6
  playlists: {
    // Placeholder for Phase 6
  },

  // Downloads endpoints will be implemented in Phase 7
  downloads: {
    // Placeholder for Phase 7
  },

  async health() {
    return apiClient.get('/health');
  },
};
```

**Nota Importante:** El backend NO envuelve las respuestas en `{ success: true, data: {...} }` para los endpoints de auth. Retorna los objetos directamente.

**Error Interceptor Enhancement:**
- Capturar errores 401 (unauthorized)
- Mostrar mensaje al usuario
- Opcionalmente redirigir a login

---

### 3. Crear Custom Hooks con TanStack Query

#### Archivo: `frontend/src/hooks/useAuth.ts`

**Hook principal de autenticación:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api.service';

export function useAuth() {
  const queryClient = useQueryClient();

  // Query para verificar estado de autenticación
  const {
    data: authStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => api.auth.status(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false, // No reintentar si falla auth
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      // Invalidar todas las queries para limpiar caché
      queryClient.clear();
    },
  });

  // Función para iniciar login (redirige a backend)
  const login = async () => {
    const { authUrl } = await api.auth.login();
    window.location.href = authUrl;
  };

  // Función para logout
  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    // Estado
    user: authStatus?.user,
    isAuthenticated: authStatus?.authenticated ?? false,
    isLoading,
    error,

    // Acciones
    login,
    logout,
    refetch,

    // Estado de mutaciones
    isLoggingOut: logoutMutation.isPending,
  };
}
```

**Características:**
- Cachea estado de auth por 5 minutos
- No reintenta automáticamente si falla
- Limpia toda la caché al hacer logout
- Retorna funciones `login()` y `logout()` listas para usar

---

### 4. Crear Componentes de UI

#### Componente: `frontend/src/components/AuthButton.tsx`

**Botón de autenticación que muestra login/logout según estado:**

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export function AuthButton() {
  const { isAuthenticated, user, login, logout, isLoading, isLoggingOut } = useAuth();

  if (isLoading) {
    return <button disabled>Loading...</button>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span>{user.name || user.email}</span>
        <button
          onClick={logout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    );
  }

  return (
    <button onClick={login}>
      Login with Google
    </button>
  );
}
```

**Características:**
- Muestra imagen de perfil si disponible
- Estados de loading claros
- Maneja login/logout automáticamente

#### Componente: `frontend/src/components/Header.tsx`

**Header de la aplicación:**

```typescript
'use client';

import Link from 'next/link';
import { AuthButton } from './AuthButton';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Playlist Manager
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/playlists">Playlists</Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
```

#### Componente: `frontend/src/components/ProtectedRoute.tsx`

**HOC para proteger rutas que requieren autenticación:**

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

#### Componente: `frontend/src/components/LoadingSpinner.tsx`

**Spinner de carga reutilizable:**

```typescript
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}
```

---

### 5. Actualizar Páginas del App Router

#### Página: `frontend/src/app/page.tsx`

**Home page con landing y login - maneja callback OAuth:**

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { isAuthenticated, login, isLoading, refetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Check for OAuth callback query params
  useEffect(() => {
    const authStatus = searchParams.get('auth');
    const error = searchParams.get('error');

    if (authStatus === 'success') {
      setAuthMessage('Authentication successful! Redirecting...');
      // Refetch auth status and redirect
      refetch().then(() => {
        setTimeout(() => router.push('/playlists'), 1000);
      });
    } else if (authStatus === 'error') {
      setAuthMessage(`Authentication failed: ${error || 'Unknown error'}`);
    } else if (authStatus === 'denied') {
      setAuthMessage('Authentication denied. Please try again.');
    }

    // Clean up query params
    if (authStatus) {
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, refetch, router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !searchParams.get('auth')) {
      router.push('/playlists');
    }
  }, [isAuthenticated, router, searchParams]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Playlist Manager</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        Manage your YouTube playlists and download videos easily
      </p>

      {authMessage && (
        <div className={`mb-4 p-4 rounded ${authMessage.includes('failed') || authMessage.includes('denied') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {authMessage}
        </div>
      )}

      <button
        onClick={login}
        disabled={isLoading}
        className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
      >
        Login with Google
      </button>
    </div>
  );
}
```

**Características:**
- Detecta query params `?auth=success|error|denied` del callback
- Muestra mensajes apropiados al usuario
- Refetch auth status después de callback exitoso
- Limpia query params de la URL
- Redirige a `/playlists` automáticamente si ya está autenticado

#### Página: `frontend/src/app/playlists/page.tsx`

**Placeholder para lista de playlists (se implementará en Fase 6):**

```typescript
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function PlaylistsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Playlists</h1>
        <p className="text-gray-600">Playlist management will be implemented in Phase 6</p>
      </div>
    </ProtectedRoute>
  );
}
```

#### Layout: `frontend/src/app/layout.tsx`

**Actualizar para incluir Header:**

```typescript
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Playlist Manager',
  description: 'Manage and download YouTube playlists',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

---

### 6. Configuración de Variables de Entorno

#### Actualizar: `frontend/.env.example`

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# App Info
NEXT_PUBLIC_APP_NAME="Playlist Manager"
NEXT_PUBLIC_APP_VERSION=1.0.0

# OAuth Callback URL (for reference)
# This should match the backend OAUTH_REDIRECT_URI
# Backend handles the OAuth callback, then redirects here:
NEXT_PUBLIC_OAUTH_CALLBACK_PATH=/auth/callback
```

---

## Archivos a Crear/Modificar

### Archivos Nuevos:
1. `frontend/src/types/auth.types.ts` - Tipos de autenticación
2. `frontend/src/types/api.types.ts` - Tipos genéricos de API
3. `frontend/src/types/playlist.types.ts` - Tipos de playlist
4. `frontend/src/types/download.types.ts` - Tipos de download
5. `frontend/src/hooks/useAuth.ts` - Hook de autenticación
6. `frontend/src/components/AuthButton.tsx` - Botón login/logout
7. `frontend/src/components/Header.tsx` - Header de app
8. `frontend/src/components/ProtectedRoute.tsx` - HOC para rutas protegidas
9. `frontend/src/components/LoadingSpinner.tsx` - Spinner
10. `frontend/src/app/playlists/page.tsx` - Página de playlists
11. `frontend/src/app/auth/callback/page.tsx` - Callback OAuth

### Archivos a Modificar:
1. `frontend/src/services/api.service.ts` - Implementar endpoints reales
2. `frontend/src/app/page.tsx` - Home page con login
3. `frontend/src/app/layout.tsx` - Agregar Header
4. `frontend/.env.example` - Documentar callback path

---

## Secuencia de Implementación

### Paso 1: Tipos TypeScript
1. Crear `frontend/src/types/auth.types.ts`
2. Crear `frontend/src/types/api.types.ts`
3. Crear `frontend/src/types/playlist.types.ts`
4. Crear `frontend/src/types/download.types.ts`

### Paso 2: API Service
1. Actualizar `frontend/src/services/api.service.ts`
2. Implementar endpoints de auth
3. Mejorar interceptores de error

### Paso 3: Hooks
1. Crear `frontend/src/hooks/useAuth.ts`
2. Configurar TanStack Query queries/mutations

### Paso 4: Componentes Base
1. Crear `frontend/src/components/LoadingSpinner.tsx`
2. Crear `frontend/src/components/AuthButton.tsx`
3. Crear `frontend/src/components/Header.tsx`
4. Crear `frontend/src/components/ProtectedRoute.tsx`

### Paso 5: Páginas
1. Actualizar `frontend/src/app/page.tsx` (home con login)
2. Crear `frontend/src/app/playlists/page.tsx` (placeholder)
3. Crear `frontend/src/app/auth/callback/page.tsx` (OAuth callback)
4. Actualizar `frontend/src/app/layout.tsx` (agregar Header)

### Paso 6: Configuración
1. Actualizar `frontend/.env.example`
2. Verificar que `frontend/.env.local` esté configurado

### Paso 7: Testing Manual
1. Iniciar backend: `cd backend && npm run dev`
2. Iniciar frontend: `cd frontend && npm run dev`
3. Abrir `http://localhost:3000`
4. Hacer clic en "Login with Google"
5. Completar OAuth
6. Verificar redirección a `/playlists`
7. Verificar estado de auth persiste en refresh
8. Probar logout

---

## Criterios de Validación

### Funcionalidad:
- ✓ Hacer clic en "Login" redirige a Google OAuth
- ✓ Después de autorizar, usuario vuelve a la app autenticado
- ✓ Estado de autenticación persiste al refrescar página
- ✓ Header muestra información del usuario cuando está autenticado
- ✓ Logout funciona y limpia el estado
- ✓ Rutas protegidas redirigen a home si no hay auth

### UX:
- ✓ Estados de loading claros en todas las operaciones
- ✓ Mensajes de error informativos
- ✓ Transiciones suaves entre estados
- ✓ UI responsive (se ve bien en mobile y desktop)

### Técnico:
- ✓ No hay errores de TypeScript
- ✓ TanStack Query maneja correctamente el caché
- ✓ Axios interceptores funcionan
- ✓ No hay console errors en el navegador
- ✓ Build de Next.js completa sin warnings

---

## Notas Técnicas

### Sobre OAuth Flow:
- **Backend maneja tokens:** Frontend nunca ve ni guarda tokens OAuth
- **Verificación:** Frontend solo verifica estado con `GET /api/auth/status`
- **Seguridad:** Cookies httpOnly manejadas por backend
- **Redirección:** Backend redirige a frontend después de OAuth success

### Sobre TanStack Query:
- **Stale time:** 5 minutos para auth status (no verificar en cada render)
- **Cache time:** Configurado en providers.tsx
- **Invalidación:** Clear completo al logout
- **Retry:** Deshabilitado para auth (error 401 es definitivo)

### Sobre Next.js App Router:
- **Client Components:** Usar `'use client'` para componentes con hooks
- **Server Components:** Por defecto, pero no usarlos para auth por ahora
- **Metadata:** Configurar en layout.tsx
- **Loading States:** Usar Suspense boundaries en futuro

### Sobre Styling:
- **Globals.css:** Estilos base ya configurados
- **Tailwind:** Considerar agregarlo en futuras iteraciones
- **Inline styles:** OK para MVP, refactorizar después

---

## Siguiente Fase

Después de implementar Fase 5, el frontend tendrá:
- ✅ Estructura completa configurada
- ✅ Autenticación OAuth funcionando
- ✅ Tipos TypeScript definidos
- ✅ Hooks y componentes base

**Fase 6** se enfocará en:
- Gestión de playlists (CRUD)
- Componentes de playlist (lista, detalle, crear/editar)
- Hooks de TanStack Query para playlists

**Fase 7** se enfocará en:
- UI de descarga de videos
- Progreso de descarga en tiempo real
- Generación y descarga de ZIP desde el frontend
