# Containers

App multiplataforma para gestionar **alquileres de contenedores** (extensible a otros rubros) con mapa, choferes, inventario y exportación.

| Plataforma | Tecnología |
|---|---|
| Móvil | Expo (React Native) |
| Escritorio | **Tauri 2** (nativo, liviano — **no Electron**) |
| Datos | AsyncStorage local por defecto · Supabase opcional |

Repo: https://github.com/RRamiS/Containers

---

## Documentación (empezá acá)

| Doc | Para qué |
|-----|----------|
| **[docs/FEATURES.md](./docs/FEATURES.md)** | Funcionalidades **hechas**, cómo funcionan y limitaciones |
| **[docs/ROADMAP.md](./docs/ROADMAP.md)** | Ideas futuras, prioridades y backlog vivo |
| **[docs/ADDING_FEATURES.md](./docs/ADDING_FEATURES.md)** | Cómo agregar features sin romper la arquitectura escalable |

Flujo recomendado entre colaboradores:

1. Se nos ocurre algo → anotarlo en el **Roadmap**
2. Se implementa siguiendo **Adding features**
3. Queda documentado en **Features**

---

## Estado del proyecto (resumen)

### Listo

- Arquitectura modular multi-rubro
- CRUD Alquileres / Contenedores / Choferes
- Mapa (San Luis, colores por estado, finalizados ocultos)
- Export CSV, Tauri desktop, modo local, schema Supabase

### Pendiente destacado

- Campos definitivos del contenedor
- Auth + subida real de recibos a Storage
- Branding / nombre final
- Tests

Detalle completo → [docs/FEATURES.md](./docs/FEATURES.md) y [docs/ROADMAP.md](./docs/ROADMAP.md).

### Cómo probar rápido (sin Supabase)

```bash
git clone https://github.com/RRamiS/Containers.git
cd Containers
npm install
npm run web          # navegador
# o
npm start            # móvil Expo Go
```

Flujo sugerido: **Chofer** → **Contenedor** → **Alquiler** (pin en mapa) → pestaña **Mapa**.

---

## Requisitos

| Para | Necesitás |
|---|---|
| Móvil / web | Node.js 20+ y npm |
| Escritorio (dev/build) | Lo anterior + [Rust](https://rustup.rs/) + en Windows [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++) + WebView2 |

Si `cargo` no aparece en PowerShell: cerrá y abrí la terminal, o usá `npm run desktop:build` (agrega Rust al PATH).

---

## Scripts

```bash
npm install
npm start                 # Expo (móvil)
npm run web               # UI en navegador
npm run desktop           # app escritorio Tauri (dev)
npm run desktop:build     # instalador .msi / .exe
```

Sin `.env`, corre en **modo local**.

---

## Supabase (opcional)

1. Proyecto en [Supabase](https://supabase.com)
2. Ejecutar [`supabase/migrations/20260727120000_init.sql`](supabase/migrations/20260727120000_init.sql)
3. Copiar `.env.example` → `.env`
4. Reiniciar la app

---

## Arquitectura

```
app/                      # rutas Expo Router
src/
  core/                   # UI, mapa, theme
  features/               # módulos de negocio
  config/industry/        # rubro (labels, estados, features)
  data/                   # repos + supabase + local
src-tauri/                # escritorio Tauri
docs/                     # features, roadmap, guía de extensión
supabase/migrations/
```

| En código | En UI (rubro containers) |
|---|---|
| `assets` | Contenedores |
| `operators` | Choferes |
| `rentals` | Alquileres |

---

## Notas para quien clona

- Compila y se usa en modo local sin cuentas externas.
- El mapa necesita red (OSM + Nominatim).
- En web/escritorio, eliminar usa `confirm` del navegador.
- Nuevas ideas → [docs/ROADMAP.md](./docs/ROADMAP.md). Cómo implementarlas → [docs/ADDING_FEATURES.md](./docs/ADDING_FEATURES.md).
