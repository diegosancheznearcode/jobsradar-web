// Tipos de UI derivados de @jobsradar/contracts, sin dependencias de React.
// Ver ARCHITECTURE.md sección 9. Los esquemas reales viven en
// @jobsradar/contracts (Fase 2, jobsradar-api) — acá se re-exportan los
// tipos Y los esquemas Zod que la UI necesita, para que ui/ y
// application/ nunca importen directamente del paquete del backend.
//
// Los esquemas (no solo los tipos) se re-exportan a propósito: Fase 7 los
// usa para validar en runtime tanto lo que el formulario manda
// (SearchCriteriaSchema) como lo que llega por SSE (SearchEventSchema) —
// ver infrastructure/SseAdapter.ts.

export type {
  SearchCriteria,
  Company,
  Founder,
  JobPosting,
  SearchEvent,
} from "@jobsradar/contracts";

export { SearchCriteriaSchema, SearchEventSchema } from "@jobsradar/contracts";
