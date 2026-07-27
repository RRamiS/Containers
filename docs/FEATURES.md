# Funcionalidades (qué hay y cómo funciona)

Documento vivo: describe lo **implementado**. Cuando se agregue o cambie una feature, actualizar esta página.

Convención de estados:

| Estado | Significado |
|--------|-------------|
| `done` | En producción / usable en el repo |
| `partial` | Existe pero incompleto o con limitaciones |
| `planned` | Solo en el [roadmap](./ROADMAP.md) |

---

## 1. Alquileres (`rentals`) — `done`

**Dónde:** pestaña Alquileres · `src/features/rentals/`

### Qué hace

CRUD completo del ciclo de alquiler de un activo (contenedor).

### Campos

| Campo | Comportamiento |
|-------|----------------|
| Fecha | Se autocompleta con **hoy** al crear (`yyyy-MM-dd`) |
| Contenedor | Solo se listan los `disponible` al crear |
| Días de alquiler | Número > 0; calcula `end_date` automáticamente |
| A nombre de | Texto libre (cliente / responsable) |
| Recibo | Imagen o PDF (URI local hoy; Storage Supabase pendiente) |
| Ubicación | Pin en mapa → `lat`/`lng` + dirección (reverse geocode, editable) |
| Chofer entrega | Obligatorio al **crear** |
| Chofer retiro | Se pide al **finalizar** / editar cierre |
| Estado | `activo` · `en_proceso` · `finalizado` |

### Flujo

```text
Crear alquiler
  → chofer entrega obligatorio
  → pin en mapa
  → estado activo
  → contenedor pasa a "alquilado"

Editar en cualquier momento (todos los campos)

Finalizar / coordinar retiro
  → chofer retiro obligatorio
  → estado finalizado
  → contenedor vuelve a "disponible"
  → deja de aparecer en el mapa
```

### Listado y filtros

- Columnas: cliente, contenedor, fechas, días, dirección, estado
- Filtro por estado (todos / activo / en proceso / finalizado)
- Botón **Exportar** → CSV del listado filtrado

### Archivos clave

- UI: `src/features/rentals/RentalFormScreen.tsx`, `RentalsListScreen.tsx`
- Datos: `src/data/repositories.ts` → `rentalsRepo`
- Labels/campos del rubro: `src/config/industry/containers.ts`

---

## 2. Contenedores / Activos (`assets`) — `partial`

**Dónde:** pestaña Contenedores · `src/features/assets/`

### Qué hace

Inventario de unidades alquilables.

### Campos actuales (mínimos)

| Campo | Notas |
|-------|-------|
| Código | Identificador visible (ej. `C-001`) |
| Notas | Texto libre |
| Estado | `disponible` · `alquilado` · `mantenimiento` |
| `metadata` | JSON listo para atributos futuros sin migrar el núcleo |

### Limitación conocida

El cliente **aún no definió** todos los atributos del contenedor (tamaño, color, serie, etc.). Cuando lleguen:

1. Preferir `metadata` o `custom_field_defs` / `custom_field_values`
2. Actualizar formulario en `AssetFormScreen`
3. Documentar acá los campos nuevos

---

## 3. Choferes / Operadores (`operators`) — `done`

**Dónde:** pestaña Choferes · `src/features/operators/`

### Qué hace

Alta, edición y eliminación de personas que entregan/retiran.

### Campos

| Campo | Notas |
|-------|-------|
| Nombre completo | Obligatorio |
| Teléfono | Opcional |
| Licencia | Opcional |
| Activo | Si está inactivo, no se ofrece en altas nuevas |

Se usan como relaciones en alquileres (`delivery_operator_id`, `pickup_operator_id`).

---

## 4. Mapa global — `done`

**Dónde:** pestaña Mapa · `src/features/map-overview/`

### Comportamiento

- Centro fijo: **San Luis, Argentina** (`-33.3017`, `-66.3378`)
- Solo muestra alquileres **no finalizados** (`activo`, `en_proceso`)
- Color del punto según estado:
  - Verde → activo
  - Amarillo → en proceso
- Filtro por estado (sin opción “finalizado”)
- Leyenda de colores encima del mapa
- Lista corta debajo; tap abre el alquiler

### Stack de mapa

- Leaflet + OpenStreetMap (sin API key de Google)
- Componente compartido: `src/core/map/LocationMap.tsx`

---

## 5. Exportación CSV — `done`

**Dónde:** botón Exportar en listado de alquileres · `src/features/exports/exportCsv.ts`

Exporta el listado **tal como está filtrado** (estado incluido). En web descarga archivo; en nativo usa Share.

---

## 6. Multi-rubro / configuración — `done` (base)

**Dónde:** `src/config/industry/`

La UI no hardcodea “Contenedor/Chofer”: lee labels, estados y features del rubro activo.

| Rubro actual | Archivo |
|--------------|---------|
| Contenedores | `containers.ts` |
| Selector | `EXPO_PUBLIC_INDUSTRY` o default `containers` |

Ver [cómo agregar features](./ADDING_FEATURES.md) para clonar un rubro nuevo.

---

## 7. Persistencia — `partial`

| Modo | Cuándo | Notas |
|------|--------|-------|
| Local (AsyncStorage) | Sin `.env` válido | Ideal para demo / offline de un dispositivo |
| Supabase | URL + anon key reales en `.env` | Schema en `supabase/migrations/` |

Limitaciones actuales:

- Recibos: URI local, no subida a bucket `attachments`
- Auth de usuarios: RLS listo en SQL, **sin pantalla de login**

---

## 8. Escritorio (Tauri) — `done`

**Dónde:** `src-tauri/`

- Misma UI que web, empaquetada como app nativa
- Scripts: `npm run desktop` · `npm run desktop:build`
- No usa Electron

---

## Matriz rápida

| Feature | Estado | Escalable vía |
|---------|--------|---------------|
| Alquileres CRUD | done | `features/rentals` + config |
| Contenedores CRUD | partial | `metadata` / custom fields |
| Choferes CRUD | done | `features/operators` |
| Mapa + filtros | done | `features/map-overview` + config estados |
| Export CSV | done | `features/exports` |
| Multi-rubro | done | `config/industry/*` |
| Auth | planned | Supabase Auth + UI |
| Storage recibos | planned | bucket `attachments` |
| Campos contenedor finales | planned | custom fields |
