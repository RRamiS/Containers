# Containers

App multiplataforma para gestionar **alquileres de contenedores** (extensible a otros rubros) con mapa, choferes, inventario y exportación.

| Plataforma | Tecnología |
|---|---|
| Móvil | Expo (React Native) |
| Escritorio | **Tauri 2** (nativo, liviano — **no Electron**) |
| Datos | AsyncStorage local por defecto · Supabase opcional |

Repo: https://github.com/RRamiS/Containers

---

## Estado del proyecto (marzo 2026)

### Listo

- [x] Arquitectura modular multi-rubro (`core` / `features` / `config/industry` / `data`)
- [x] CRUD **Alquileres** (fecha auto = hoy, recibo, días, a nombre de, mapa con pin, chofer entrega/retiro, todo editable)
- [x] CRUD **Contenedores** (inventario mínimo: código, notas, estado)
- [x] CRUD **Choferes**
- [x] Listado de alquileres con filtro por estado + **export CSV**
- [x] Mapa global centrado en **San Luis, Argentina**
- [x] Markers con color según estado (activo / en proceso)
- [x] Alquileres **finalizados no aparecen** en el mapa
- [x] App de escritorio Tauri (`npm run desktop` / `desktop:build`)
- [x] Migración SQL Supabase + `.env.example`
- [x] Modo local sin configurar backend

### Pendiente / a definir

- [ ] Campos definitivos del inventario de contenedores (hoy son mínimos; el cliente aún no pasó el detalle)
- [ ] Auth completa de usuarios (login/roles) — schema RLS preparado, UI de login no armada
- [ ] Subida real de recibos a Storage de Supabase (hoy se guarda URI local)
- [ ] Branding / nombre final del producto (el repo se llama `Containers` de forma provisional)
- [ ] Tests automatizados

### Cómo probar rápido (sin Supabase)

```bash
git clone https://github.com/RRamiS/Containers.git
cd Containers
npm install
npm run web          # ver UI en navegador
# o
npm start            # móvil con Expo Go
```

Flujo sugerido: crear un **Chofer** → un **Contenedor** → un **Alquiler** (marcar pin en el mapa) → verlo en la pestaña **Mapa**.

---

## Requisitos

| Para | Necesitás |
|---|---|
| Móvil / web | Node.js 20+ y npm |
| Escritorio (dev/build) | Lo anterior + [Rust](https://rustup.rs/) + en Windows [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++) + WebView2 |

Si `cargo` no aparece en PowerShell: cerrá y abrí la terminal, o usá `npm run desktop:build` (el script agrega Rust al PATH).

---

## Scripts

```bash
npm install
npm start                 # Expo (móvil)
npm run web               # UI en navegador
npm run desktop           # app escritorio Tauri (dev)
npm run desktop:build     # instalador .msi / .exe
```

Sin `.env`, corre en **modo local** (datos en el dispositivo).

---

## Supabase (opcional, multi-dispositivo)

1. Proyecto en [Supabase](https://supabase.com)
2. Ejecutar [`supabase/migrations/20260727120000_init.sql`](supabase/migrations/20260727120000_init.sql)
3. Copiar `.env.example` → `.env` y completar URL + anon key
4. Reiniciar la app

---

## Arquitectura

```
app/                      # rutas Expo Router (pantallas finas)
src/
  core/                   # UI, mapa Leaflet, theme, confirmaciones
  features/               # assets, operators, rentals, map-overview, exports
  config/industry/        # rubro activo (labels, estados, features)
  data/                   # tipos, repositorios, supabase, localDb
src-tauri/                # shell escritorio Tauri (Rust)
supabase/migrations/      # schema genérico
```

### Dominio genérico (no acoplado a “contenedores”)

| En código | En UI (rubro containers) |
|---|---|
| `assets` | Contenedores |
| `operators` | Choferes |
| `rentals` | Alquileres |

Para otro rubro: copiar `src/config/industry/containers.ts`, ajustar labels/estados y activar con `EXPO_PUBLIC_INDUSTRY`.

---

## Funcionalidades

| Módulo | Detalle |
|---|---|
| Alquileres | Fecha auto, recibo, días, cliente, mapa, chofer entrega al crear / retiro al finalizar |
| Contenedores | Inventario editable (campos mínimos) |
| Choferes | Alta / edición / baja |
| Mapa | Solo activos y en proceso; centro San Luis; color por estado |
| Exportar | CSV del listado filtrado |

### Flujo de alquiler

1. Crear → fecha hoy + chofer entrega + pin en mapa  
2. Editar en cualquier momento  
3. Finalizar → pedir chofer de retiro → contenedor vuelve a `disponible` → desaparece del mapa  

### Ubicación

- Fuente de verdad: `lat` / `lng`  
- Dirección: reverse geocode al marcar el punto (editable)  

---

## Notas para quien clona

- El proyecto **compila** y se puede usar en modo local sin cuentas externas.
- El mapa necesita red (tiles OSM + geocoding Nominatim).
- En escritorio/web, los diálogos de eliminar usan `confirm` nativo del navegador (no el `Alert` de React Native).
- Los campos extra de contenedores se pueden sumar con `metadata` o `custom_field_defs` sin reescribir alquileres.
