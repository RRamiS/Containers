# Cómo agregar funcionalidades (escalable)

Este proyecto está pensado para **crecer sin reescribir el núcleo**. Antes de codear una idea, leé esto + [FEATURES.md](./FEATURES.md) + [ROADMAP.md](./ROADMAP.md).

---

## Principios

1. **Dominio genérico en código** (`assets`, `operators`, `rentals`) — nunca acoplar lógica a “contenedor” o “chofer”.
2. **Rubro en config** — textos, colores, estados y flags viven en `src/config/industry/`.
3. **Features por carpeta** — cada módulo en `src/features/<nombre>/`.
4. **Pantallas flacas** — `app/` solo importa y renderiza; la lógica está en `features` + `data`.
5. **Datos detrás de repos** — UI habla con `*Repo`, no con AsyncStorage/Supabase directo.
6. **Extender antes de forkar** — preferir `metadata`, custom fields, flags de config, antes de tablas rígidas nuevas.

---

## Checklist al sumar una feature

### 1. Anotar la idea

- Agregar ítem en [ROADMAP.md](./ROADMAP.md) (Backlog o Próximo).
- Una frase: problema → solución esperada.

### 2. Decidir capa

| Tipo de cambio | Dónde tocar |
|----------------|-------------|
| Solo textos / estados / on-off | `src/config/industry/*.ts` |
| Nuevo CRUD de negocio | `src/features/<modulo>/` + repo en `src/data/` + ruta en `app/` |
| UI reutilizable (botón, mapa, tabla) | `src/core/` |
| Schema cloud | `supabase/migrations/` (nueva migración, no editar a lo loco la vieja en prod) |
| Escritorio nativo | casi nunca; solo si es permiso/OS (`src-tauri`) |

### 3. Implementar sin romper multi-rubro

- Labels con `label()` / `industry.labels…`, no strings hardcodeados de “Contenedor”.
- Features opcionales detrás de `industry.features.*` cuando aplique.
- Si el campo es específico de un rubro → `metadata` o custom field, no columna obligatoria para todos.

### 4. Documentar

- Actualizar [FEATURES.md](./FEATURES.md) (estado `done`/`partial` + cómo funciona).
- Mover/tachar el ítem en [ROADMAP.md](./ROADMAP.md).
- Si cambia el arranque o requisitos → [README.md](../README.md).

### 5. Probar el camino feliz

1. `npm run web` (o `desktop`)
2. Flujo mínimo: alta → listado → edición → (si aplica) mapa/export
3. Verificar modo local **y**, si hay `.env`, modo Supabase

---

## Recetas comunes

### A) Nuevo campo en alquileres (todos los rubros)

1. Tipo en `src/data/types.ts`
2. Migración Supabase + soporte en `rentalsRepo` (local + cloud)
3. Input en `RentalFormScreen`
4. Columna en listado/export si corresponde
5. Documentar en FEATURES

### B) Nuevo campo solo de contenedores (este rubro)

1. Preferir `asset.metadata.miCampo` o fila en `custom_field_defs`
2. UI en `AssetFormScreen`
3. No tocar el núcleo de rentals salvo mostrar el dato

### C) Nuevo rubro (otra empresa / industria)

1. Copiar `src/config/industry/containers.ts` → `otro.ts`
2. Cambiar labels, estados, features, colores
3. Registrar en `src/config/industry/index.ts`
4. Activar `EXPO_PUBLIC_INDUSTRY=otro`
5. No duplicar pantallas si el flujo es el mismo

### D) Nueva pantalla / módulo

```text
src/features/mi-modulo/
  MiModuloListScreen.tsx
  MiModuloFormScreen.tsx
app/(tabs)/mi-modulo.tsx          # o stack route
src/data/repositories.ts          # + repo
```

Agregar tab solo si es navegación primaria (`app/(tabs)/_layout.tsx`).

### E) Idea que aún no sabemos cómo modelar

1. Roadmap → Backlog
2. Spike corto (1–2h) en rama
3. Elegir la opción que menos acopla al rubro
4. Recién ahí implementar

---

## Qué evitar

- Hardcodear “Contenedor”, “Chofer”, San Luis en lógica de negocio (San Luis puede vivir en config de mapa a futuro).
- Hablar con Supabase/AsyncStorage desde un screen.
- Meter Electron u otro runtime de escritorio paralelo a Tauri.
- Editar el plan adjunto de Cursor; la fuente de verdad del producto son estos docs en el repo.
- Commitear `.env` con claves reales.

---

## Diagrama mental

```text
Idea → ROADMAP
     → ¿solo config? → industry/*.ts
     → ¿módulo nuevo? → features/ + data/ + app/
     → ¿schema? → supabase/migrations
     → FEATURES.md actualizado
```

Si dudás entre dos diseños, elegí el que permita **otro rubro mañana sin fork**.
