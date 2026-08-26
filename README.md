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

## `@diegosancheznearcode/contracts`

Se instala como una dependencia normal (`^0.1.0`) desde GitHub Packages —
`jobsradar-api` la publica ahí en cada push a `main` (ver su
`.github/workflows/ci.yml`). Como `jobsradar-api` es un repo privado, tanto
el desarrollo local como el CI necesitan autenticarse contra
`npm.pkg.github.com` para poder instalarla. `.npmrc` de este repo ya mapea el
scope:

```
@diegosancheznearcode:registry=https://npm.pkg.github.com
```

pero **no** el token — pnpm rechaza expandir variables de entorno en
credenciales que vienen de un `.npmrc` de proyecto (committeado), por
seguridad. El token va en un `.npmrc` fuera del repo:

- Desarrollo local: `pnpm config set "//npm.pkg.github.com/:_authToken" <tu-PAT>`
  (queda en tu `~/.npmrc` de usuario, nunca se commitea). Tiene que ser un
  **classic PAT** con scopes `read:packages` + `repo` — un fine-grained
  token con permiso "Packages: Read-only" no funciona contra
  `npm.pkg.github.com` (GitHub Packages no reconoce ese modelo de permisos
  ahí, devuelve 403 igual; ver ARCHITECTURE.md sección 9, Fase 9).
- CI: `actions/setup-node` con `registry-url` genera ese `.npmrc` de usuario
  a partir del secret `JOBSRADAR_API_RO_TOKEN` (el mismo classic PAT) — ver
  el workflow.

## Estado (Fase 1 — scaffold)

`App.tsx` solo confirma que `ui/ → application/ → infrastructure/` están
cableados end-to-end (instancia `HttpSearchAdapter`, que implementa
`SearchPort`). La UI real (formulario de búsqueda, tabla, exportación) llega
en la Fase 7 — ver la sección 12 de `docs/ARCHITECTURE.md`.

## Estructura

```
src/
├── domain/          tipos de UI derivados de @diegosancheznearcode/contracts, sin React
├── application/      casos de uso (useSearch) + puertos (SearchPort, ExportPort)
├── infrastructure/   adaptadores: HttpSearchAdapter, SseAdapter, CsvExportAdapter
└── ui/               componentes, páginas (App.tsx) — consume application/ vía puertos
```

Ver ARCHITECTURE.md secciones 9 y 9.1 para el detalle de cada puerto/adaptador.
