import type { SearchCriteria, SearchEvent } from "../domain";

// Puertos del frontend — ver ARCHITECTURE.md sección 9.1. `ui/` y el resto de
// `application/` dependen solo de estas interfaces, nunca de `fetch` o
// `EventSource` directamente; eso vive en `infrastructure/`.

export interface SearchPort {
  start(criteria: SearchCriteria): Promise<{ searchId: string }>;
  subscribe(searchId: string, onEvent: (event: SearchEvent) => void): () => void;
}

export interface ExportPort {
  // locationFilter opcional — mismo filtro que ResultsTable aplica en
  // pantalla (sección 9.1 resultado Fase 11). Sin pasarlo, el CSV traía
  // todas las empresas aunque la tabla mostrara solo un subconjunto
  // filtrado — bug real reportado por el usuario.
  downloadCsv(searchId: string, locationFilter?: string): Promise<void>;
}
