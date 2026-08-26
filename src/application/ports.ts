import type { SearchCriteria, SearchEvent } from "../domain";

// Puertos del frontend — ver ARCHITECTURE.md sección 9.1. `ui/` y el resto de
// `application/` dependen solo de estas interfaces, nunca de `fetch` o
// `EventSource` directamente; eso vive en `infrastructure/`.

export interface SearchPort {
  start(criteria: SearchCriteria): Promise<{ searchId: string }>;
  subscribe(searchId: string, onEvent: (event: SearchEvent) => void): () => void;
}

export interface ExportPort {
  downloadCsv(searchId: string): Promise<void>;
}
