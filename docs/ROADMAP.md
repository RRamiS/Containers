# Roadmap

Ideas y trabajo futuro. Esto **no es un compromiso de fechas**: es una cola priorizable que crece a medida que se nos ocurren cosas.

Última actualización: 2026-07-27

---

## Cómo usar este documento

1. Cuando surja una idea → agregarla en **Backlog** (abajo) con una línea clara.
2. Si vale la pena implementarla pronto → moverla a **Próximo**.
3. Al terminar → marcar en [FEATURES.md](./FEATURES.md) como `done` / `partial` y sacarla de acá (o dejarla tachada con link).
4. Proceso técnico: [ADDING_FEATURES.md](./ADDING_FEATURES.md)

Plantilla de ítem:

```md
- [ ] **Título corto** — descripción en 1 frase. (prioridad: alta|media|baja) — owner opcional
```

---

## Ahora / corto plazo (Próximo)

- [ ] **Campos reales del contenedor** — cuando el cliente pase el listado (tamaño, color, n° serie, etc.), modelarlos con custom fields / metadata sin romper alquileres. (alta)
- [ ] **Subida de recibos a Supabase Storage** — bucket `attachments`, URL pública/firmada en el alquiler. (alta)
- [ ] **Login básico** — email/password con Supabase Auth + pantalla de acceso. (alta)
- [ ] **Nombre / branding final** — renombrar app y package cuando definan el producto. (media)

---

## Mediano plazo

- [ ] **Roles** — admin vs operador (quién puede borrar, exportar, ver todo). (media)
- [ ] **Notificaciones / vencimientos** — avisar cuando un alquiler está por vencer según `end_date`. (media)
- [ ] **Historial de movimientos** — quién entregó/retiró y cuándo (auditoría liviana). (media)
- [ ] **Filtros avanzados en listados** — por chofer, contenedor, rango de fechas, cliente. (media)
- [ ] **Export Excel** además de CSV. (baja)
- [ ] **Dashboard resumen** — cantidad activos, por vencer, disponibles. (media)
- [ ] **Fotos del contenedor en ubicación** — adjuntos además del recibo. (baja)

---

## Largo plazo / escalabilidad producto

- [ ] **Multi-empresa (tenants)** — varios clientes en la misma app con datos aislados. (alta a futuro)
- [ ] **Más rubros listos** — maquinaria, baños químicos, generadores (solo config + campos). (media)
- [ ] **App móvil stores** — builds EAS / Play Store / App Store. (media)
- [ ] **Sync offline robusta** — cola de cambios locales → cloud. (baja)
- [ ] **Reportes PDF** de un alquiler o del período. (baja)
- [ ] **Integración mapas pagos** (Mapbox/Google) si OSM no alcanza. (baja)
- [ ] **Tests** (unitarios de repos + e2e críticos del flujo alquiler). (media)

---

## Backlog (ideas sueltas)

> Agregar acá todo lo que se nos ocurra. No ordenar todavía.

- [ ] Búsqueda global (cliente / código contenedor / chofer)
- [ ] Duplicar un alquiler similar (mismo cliente, otro contenedor)
- [ ] Calendario de ocupaciones por contenedor
- [ ] Firmas digitales en entrega/retiro
- [ ] WhatsApp deep-link al chofer con dirección del pin
- [ ] Modo solo-lectura para clientes externos
- [ ] Tema claro/oscuro configurable por empresa
- [ ] Idioma EN (i18n formal; hoy labels viven en config del rubro)

---

## Hecho recientemente (referencia)

- Modelo de gestión por **Stock de Contenedores** (sin IDs individuales) y diferenciación de contenedores **Fijos** vs **Temporales**.
- Estados de stock: En depósito, En cliente, En tránsito y Fijos.
- App Expo + Tauri, CRUDs alquileres/activos/choferes
- Mapa San Luis, colores por estado, finalizados ocultos
- Export CSV, modo local, schema Supabase, docs de handoff

Detalle de comportamiento: [FEATURES.md](./FEATURES.md)
