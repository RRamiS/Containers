# Containers

Aplicación multiplataforma para gestionar alquileres de activos con ubicación en mapa, operadores y exportación.

- **Móvil:** Expo (React Native)
- **Escritorio:** app nativa con **Tauri 2** (WebView del sistema + Rust). **No usa Electron.**

El primer rubro configurado es **contenedores**, pero el núcleo es genérico y se adapta a otros negocios sin reescribir la app.

## Stack

- Expo (React Native) + Expo Router — móvil
- **Tauri 2** — escritorio dedicado, binario liviano (~pocos MB vs cientos de Electron)
- TypeScript
- Supabase (PostgreSQL, Auth, Storage) — opcional
- Leaflet + OpenStreetMap para mapas
- AsyncStorage como modo local si no hay Supabase configurado

## Requisitos de escritorio

1. [Rust](https://rustup.rs/) (`rustc` / `cargo`) — ya debería estar en `%USERPROFILE%\.cargo\bin`
2. En Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) con workload “Desktop development with C++”
3. WebView2 (viene en Windows 10/11 actualizados)

Si `cargo` no se reconoce en PowerShell, **cerrá y abrí de nuevo la terminal** (o ejecutá `npm run desktop:build`, que agrega Rust al PATH automáticamente).

## Arranque rápido

```bash
npm install

# Móvil
npm start

# Escritorio dedicado (Tauri — no Electron)
npm run desktop

# Empaquetar instalador de escritorio (.msi / .exe)
npm run desktop:build

# Solo UI en navegador (debug)
npm run web
```

Sin variables de entorno, la app corre en **modo local** (datos en el dispositivo).

## Por qué Tauri y no Electron

| | Tauri | Electron |
|---|---|---|
| Runtime | WebView del SO | Chromium embebido |
| Tamaño típico | ~5–15 MB | 100–200+ MB |
| RAM | Baja | Alta |
| Backend | Rust | Node |

La UI se comparte con la versión web de Expo; el shell de escritorio es nativo y liviano.

## Supabase (producción / multi-dispositivo)

1. Creá un proyecto en [Supabase](https://supabase.com).
2. Ejecutá la migración [`supabase/migrations/20260727120000_init.sql`](supabase/migrations/20260727120000_init.sql) en el SQL Editor.
3. Copiá `.env.example` a `.env` y completá:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_INDUSTRY=containers
```

4. Reiniciá la app (`npm start` o `npm run desktop`).

## Arquitectura modular

```
app/                    # rutas (thin screens)
src/
  core/                 # UI, mapa, theme
  features/             # assets, operators, rentals, map-overview, exports
  config/industry/      # configuración por rubro
  data/                 # tipos, repos, supabase, localDb
src-tauri/              # shell de escritorio (Tauri / Rust)
supabase/migrations/    # schema genérico
```

## Adaptar a otro rubro

1. Copiá `src/config/industry/containers.ts` → `src/config/industry/<nuevo>.ts`.
2. Cambiá labels (`asset`, `operator`, `rental`), estados, features y branding.
3. Registralo en `src/config/industry/index.ts`.
4. Activá con `EXPO_PUBLIC_INDUSTRY=<nuevo>`.

Los campos extra del inventario se pueden agregar vía `metadata` (jsonb) o `custom_field_defs` / `custom_field_values` sin tocar el flujo de alquileres.

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| Alquileres | CRUD con fecha auto, recibo, días, cliente, mapa, chofer entrega/retiro |
| Contenedores | CRUD de inventario (campos mínimos, extensibles) |
| Choferes | CRUD de operadores |
| Mapa | Todos los alquileres con filtro por estado |
| Exportar | CSV del listado filtrado |

## Flujo de alquiler

1. Crear alquiler → fecha = hoy, chofer de entrega obligatorio, pin en mapa.
2. Durante el alquiler todo es editable.
3. Al finalizar / coordinar retiro → se pide chofer de retiro y el activo vuelve a `disponible`.

## Ubicación

Se guardan **coordenadas** (`lat`/`lng`) como fuente de verdad y una **dirección** legible (reverse geocoding al marcar el punto, editable).
