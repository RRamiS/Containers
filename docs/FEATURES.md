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

### Listado y tabla visual

- Tabla con encabezado redondeado oscuro (`#1C2128`) y filas ordenadas: **Cliente / Obra**, **Ubicación**, **Duración & Fechas**, **Chofer** y **Estado**.
- Filas clickeables que abren el detalle e historial individual del alquiler (`/rentals/[id]`).
- Filtro selector por estado y exportación a CSV.

### Archivos clave

- UI: `src/features/rentals/RentalFormScreen.tsx`, `RentalsListScreen.tsx`
- Datos: `src/data/repositories.ts` → `rentalsRepo`
- Labels/campos del rubro: `src/config/industry/containers.ts`

---

## 2. Contenedores / Activos (`assets`) — `done`

**Dónde:** pestaña Contenedores · `src/features/assets/`

### Qué hace

Gestión del parque de contenedores mediante **Stock de Unidades** (sin identificadores o códigos individuales obligatorios) y registro de **Contenedores Fijos**.

### Estados del Stock

| Estado Interno | Etiqueta en UI | Descripción |
|---|---|---|
| `en_deposito` | **En Depósito** | Contenedores disponibles/vacíos parados en la base. |
| `en_cliente` | **En Cliente / Colocado** | Contenedores colocados en alquileres temporales activos. |
| `en_transito` | **En Tránsito / Camión** | Contenedores en viaje (entrega, retiro o recambio). |
| `fijo` | **Fijo** | Contenedores asignados a ubicaciones permanentes o de meses de duración. |

### Contenedores Fijos vs. Temporales

1. **Temporales:** Se gestionan vía la solapa *Alquileres*, descontando y restituyendo stock del depósito automáticamente.
2. **Fijos:** Se configuran directamente en la solapa *Contenedores*, asignándoles cliente/empresa, dirección, fecha de colocación y geolocalización en el mapa (destacados en color violeta `#7B1FA2`).

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
| Usuario (Login) | Asignado por el Admin para permitir acceso al Chofer |
| Contraseña | Clave de acceso para el Chofer |
| Activo | Si está inactivo, no se ofrece en altas nuevas ni permite login |

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

## 9. Estadísticas y Transacciones — `done`

**Dónde:** solapa Stats (`app/(tabs)/stats.tsx`) · `src/features/stats/`

- **Dashboard Financiero/Operativo:** Total cobrado ($), Total pendiente ($), Operaciones activas y finalizadas.
- **Eliminación de Borde Azul de Foco:** Desactivación global de bordes celestes por defecto (`outline: none`) en botones, campos y filas de tablas.
- **Efectos Hover y Prensa:** Efecto sutil que aclara el tono de fondo al pasar o presionar sobre botones, píldoras de filtro y filas de la tabla (`#1F2732` / `#F1F5F9`).
- **Cierre de Filtros al Hacer Clic Afuera:** Incorporación de capa invisible de captura que pliega automáticamente cualquier menú desplegable o calendario al hacer clic en cualquier sector exterior de la pantalla.
- **Corrección de Números en Calendario (Modo Oscuro):** Números del selector de rango de fechas estilizados en blanco nítido (`#FFFFFF`) para máxima visibilidad en modo oscuro.
- **Conmutador de Modo Claro / Oscuro Animado:** Switch tipo cápsula con animación física deslizante Spring (Sol ☀️ / Luna 🌙) que propaga el tema claro o gris oscuro a todos los componentes de la app con persistencia local (`@containers/theme_mode`).
- **Botón y Modal de Perfil de Usuario:** Botón circular con ícono de usuario en la barra superior derecha que despliega un modal estilizado con nombre (**Emiliano Romero**), rol (**Administrador**), email y acciones de sesión.
- **Modal CRUD de Nuevo Alquiler:** Rediseño del formulario a ventana modal flotante centrada con fondo atenueado (`rgba(0,0,0,0.7)`).
- **Control de Fechas Dual:** Badge de *Fecha de Registro* automática con hora (`DD/MM/YYYY - HH:mm`) y selector interactivo de *Fecha de Entrega* con calendario popover estilo Estadísticas.
- **Input Stepper de Días (+/-):** Control de incremento/decremento configurado en `3` días por defecto.
- **Selects y Montos Lado a Lado:** Selectores desplegables estilo Estadísticas para *Estado del Pago* y *Chofer*, y campos de *Monto Unitario ($)* y *Monto Total ($)* posicionados en dos columnas con cálculo automático recíproco.
- **Carga de Comprobante Condicional:** El cuadro de carga de comprobante/recibo se ubica directamente debajo del selector de *Estado del Pago* y solo aparece de forma dinámica cuando se selecciona `Pago Realizado`.
- **Sistema Global de Toast Notifications:** Componente `ToastProvider` e interfaz `toast` con las 5 variantes del diseño de referencia (`success`, `info`, `error`, `warning`, `loading`). Notifica automáticamente acciones como la creación/actualización/eliminación de alquileres, exportaciones CSV, copiado de IDs al portapapeles, cambios de tema y cierre de sesión.
- **Solapa y Rediseño de Operaciones Diarias:** Renombrado de la solapa principal a **Operaciones Diarias** con la misma estética de filtros flotantes en píldora (*Estado Operativo*, *Estado de Pago*, *Chofer*, *Rango de Fechas*, *Exportar CSV*, *Search...* y *+ Nuevo Alquiler*) y tabla de 9 columnas centrada (`minWidth 980px`) con avatares de cliente, IDs copiables y botones de acción circulares.
- **Mapa Operativo & Paleta de Colores Unificada:** 
  - 💛 **Depósito:** Amarillo (`#F59E0B`), mostrando el conteo real unificado de stock en depósito (**23** tanto en la chincheta del mapa como en las métricas).
  - 🔵 **Contenedores Fijos:** Azul (`#2563EB`) tanto en los pines del mapa como en la leyenda, píldora de stock y encabezado de la Columna 1.
  - 🟢 **Entregados / Activos:** Verde (`#16A34A`), con inclusión completa de alquileres en estado `activo` y `entregado` en la Columna 3.
  - 🩵 **En Tránsito:** Celeste (`#0EA5E9`) en los pines de traslados, leyenda y Columna 2.
- **Modal de Edición de Flota Total:** Componente modal flotante `EditFleetModal` con control stepper (`-`/`+`) y botones de atajo rápido (`20`, `30`, `50`, `75`, `100` u.) accesible mediante el botón de edición (✏️) al lado de la *Flota Total* en el Mapa.
- **Superposición de Popovers (zIndex Stacking):** Orden de apilamiento decreciente por fila que garantiza que los menús desplegables y el calendario floten sobre todos los elementos inferiores sin cortarse.

---

## 10. Login y Autenticación (Admin / Choferes) — `done`

**Dónde:** ruta `/login` (`app/login.tsx`) · `src/features/auth/LoginScreen.tsx` · `src/core/auth/AuthContext.tsx`

- **Pantalla de Inicio de Sesión (`/login`)**:
  - Selector superior de rol: **Admin** vs **Choferes** en contenedor/card con estética oscura minimalista.
  - Campos: **Usuario *** y **Password *** con subtexto de validación y estrellas rojas indicativas.
  - Botones de acción: Botón pill azul **`✓ Submit`** y botón pill gris **`Reset`** para limpiar inputs.
- **Administrador Único (Admin)**:
  - Usuario predeterminado: **`federico`** (contraseña: `123456` o `Admin123!`).
  - Acceso completo a toda la suite de administración (Operaciones Diarias, Mapa, Estadísticas y Choferes).
- **Choferes / Operadores**:
  - El Administrador asigna **Usuario** y **Contraseña** a cada chofer desde el CRUD de Choferes (`OperatorFormScreen.tsx`).
  - Los choferes pueden loguearse con su usuario y contraseña asignados.
- **Gestión de Sesión & Guard de Rutas**:
  - `AuthProvider` centralizado con almacenamiento persistente en `AsyncStorage`.
  - Redirección automática a `/login` para usuarios no autenticados.
  - Cierre de sesión (`Logout`) integrado en el modal de perfil de la barra superior.

---

## Matriz rápida

| Feature | Estado | Escalable vía |
|---------|--------|---------------|
| Operaciones Diarias (Alquileres CRUD) | done | `features/rentals` + config |
| Contenedores Stock & Fijos | done | `features/assets` + `fixedContainersRepo` |
| Estadísticas & Transacciones | done | `features/stats` |
| Choferes CRUD + Credenciales | done | `features/operators` |
| Mapa + filtros | done | `features/map-overview` + config estados |
| Export CSV | done | `features/exports` |
| Barra Flotante Pill | done | `app/(tabs)/_layout.tsx` |
| Multi-rubro | done | `config/industry/*` |
| Auth & Pantalla Login (Admin / Choferes) | done | `src/core/auth` + `features/auth` |

| Storage recibos | planned | bucket `attachments` |
