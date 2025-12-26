# PNPM Setup Guide

Este proyecto utiliza **pnpm** como gestor de paquetes en lugar de npm o yarn.

## ¿Por qué pnpm?

- **Más rápido**: Instalaciones hasta 2x más rápidas que npm/yarn
- **Ahorro de espacio**: Usa enlaces simbólicos y un store global, ahorrando ~70% de espacio
- **Seguridad**: Evita el "phantom dependencies" problem
- **Compatible**: Funciona con npm, yarn y package.json existente

## Instalación de pnpm

Si no tienes pnpm instalado:

```bash
# Usando npm
npm install -g pnpm

# O usando corepack (recomendado en Node 16+)
corepack enable
corepack prepare pnpm@latest --activate
```

## Comandos Principales

### Instalación de dependencias

```bash
# Instalar todas las dependencias del workspace
pnpm install

# Instalar una dependencia en un workspace específico
pnpm --filter backend add fastify
pnpm --filter frontend add react

# Instalar una dependencia de desarrollo
pnpm --filter backend add -D typescript
```

### Scripts

```bash
# Ejecutar ambos proyectos en desarrollo
pnpm dev

# Ejecutar solo backend
pnpm dev:backend

# Ejecutar solo frontend
pnpm dev:frontend

# Build de ambos proyectos
pnpm build

# Build de un proyecto específico
pnpm build:backend
pnpm build:frontend

# Tests
pnpm test                # Todos los tests
pnpm test:backend        # Tests del backend
pnpm test:frontend       # Tests del frontend
```

### Comandos útiles de pnpm

```bash
# Ver todas las dependencias instaladas
pnpm list

# Ver dependencias de un workspace
pnpm --filter backend list
pnpm --filter frontend list

# Actualizar dependencias
pnpm update

# Actualizar pnpm
pnpm self-update

# Limpiar cache
pnpm store prune
```

## Estructura del Proyecto

```
playlist-manager/
├── node_modules/           # Dependencias compartidas (symlinks)
│   └── .pnpm/             # Store de pnpm (real packages)
├── backend/
│   ├── node_modules/      # Symlinks a dependencias
│   └── package.json
├── frontend/
│   ├── node_modules/      # Symlinks a dependencias
│   └── package.json
├── package.json           # Root workspace config
├── pnpm-workspace.yaml    # Configuración de workspaces
├── pnpm-lock.yaml         # Lockfile (commit esto!)
└── .npmrc                 # Configuración de pnpm
```

## Configuración (.npmrc)

El proyecto incluye un `.npmrc` con configuraciones optimizadas:

- `auto-install-peers=true`: Instala automáticamente peer dependencies
- `strict-peer-dependencies=false`: No falla por conflictos de peers
- `public-hoist-pattern`: Hoisting de paquetes específicos para mejor compatibilidad

## Migración desde npm

Si vienes de npm:

| npm | pnpm |
|-----|------|
| `npm install` | `pnpm install` |
| `npm run dev` | `pnpm dev` |
| `npm run build` | `pnpm build` |
| `npm install pkg` | `pnpm add pkg` |
| `npm uninstall pkg` | `pnpm remove pkg` |
| `npm run --workspace=backend dev` | `pnpm --filter backend dev` |

## Ventajas en este proyecto

### Antes (con npm):
- **Espacio en disco**: ~1.2 GB en node_modules
- **Tiempo de instalación**: ~2-3 minutos
- **Duplicación**: React, TypeScript, etc. duplicados en cada workspace

### Ahora (con pnpm):
- **Espacio en disco**: ~690 MB en node_modules
- **Tiempo de instalación**: ~7 segundos (con cache)
- **Sin duplicación**: Dependencias compartidas se instalan una sola vez

## Troubleshooting

### Error: Cannot find module

Si ves errores de módulos no encontrados, intenta:

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules backend/node_modules frontend/node_modules
pnpm install
```

### Problemas con TypeScript

Si TypeScript no encuentra tipos, verifica el `.npmrc`:

```ini
# Asegúrate de que estos paquetes están hoisted
public-hoist-pattern[]=*google-auth-library*
public-hoist-pattern[]=*googleapis*
```

### Actualizar pnpm

```bash
pnpm self-update
```

## Recursos

- [Documentación oficial de pnpm](https://pnpm.io/)
- [Workspaces](https://pnpm.io/workspaces)
- [CLI Commands](https://pnpm.io/cli/add)
