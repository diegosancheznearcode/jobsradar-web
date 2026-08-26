// Puertos del frontend — ver ARCHITECTURE.md sección 9.1. `ui/` y el resto de
// `application/` dependen solo de estas interfaces, nunca de `fetch` o
// `EventSource` directamente; eso vive en `infrastructure/`.
//
// Los tipos reales (SearchCriteria, SearchEvent) llegan con Fase 2/6, cuando
// @jobsradar/contracts tenga los esquemas de verdad — por ahora se tipan como
// `unknown` a propósito, no con `any`, para que el placeholder siga siendo
// estricto.

export interface SearchPort {
  start(criteria: unknown): Promise<{ searchId: string }>;
  subscribe(searchId: string, onEvent: (event: unknown) => void): () => void;
}

export interface ExportPort {
  downloadCsv(searchId: string): Promise<void>;
}
