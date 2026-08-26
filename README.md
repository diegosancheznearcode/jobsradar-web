# jobsradar-web

Frontend de **JobsRadar** — React 19 + Vite + TypeScript + Tailwind +
TanStack Query/Table, con arquitectura hexagonal (`domain` /
`application` / `infrastructure` / `ui`). La especificación completa y
vinculante vive en [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — si el
código y el documento no coinciden, el documento gana.

Repo separado de [`jobsradar-api`](../jobsradar-api) (AD-11); se comunican por
HTTP/SSE, no por import directo.

## Desarrollo

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Requiere que `jobsradar-api` esté corriendo en `VITE_API_URL`
(por defecto `http://localhost:3000`).

## `@jobsradar/contracts` — TODO conocido

Todavía no existe un registro npm privado, así que este repo depende de
`@jobsradar/contracts` como referencia local:

```json
"@jobsradar/contracts": "file:../jobsradar-api/packages/contracts"
```

Esto asume que `jobsradar-api` está clonado como carpeta hermana
(`../jobsradar-api`) y con `packages/contracts` compilado
(`pnpm --filter @jobsradar/contracts build`). El CI reproduce esto
clonando `jobsradar-api` como sibling — ver el TODO marcado en
`.github/workflows/ci.yml` (pendiente apuntar al remoto real). Cuando se
publique el paquete a un registro real, se reemplaza por una versión normal
(`@jobsradar/contracts@^0.x`) y este workaround desaparece.

## Estado (Fase 1 — scaffold)

`App.tsx` solo confirma que `ui/ → application/ → infrastructure/` están
cableados end-to-end (instancia `HttpSearchAdapter`, que implementa
`SearchPort`). La UI real (formulario de búsqueda, tabla, exportación) llega
en la Fase 7 — ver la sección 12 de `docs/ARCHITECTURE.md`.

## Estructura

```
src/
├── domain/          tipos de UI derivados de @jobsradar/contracts, sin React
├── application/      casos de uso (useSearch) + puertos (SearchPort, ExportPort)
├── infrastructure/   adaptadores: HttpSearchAdapter, SseAdapter, CsvExportAdapter
└── ui/               componentes, páginas (App.tsx) — consume application/ vía puertos
```

Ver ARCHITECTURE.md secciones 9 y 9.1 para el detalle de cada puerto/adaptador.
