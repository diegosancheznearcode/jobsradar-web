// Tipos de UI derivados de @jobsradar/contracts, sin dependencias de React.
// Ver ARCHITECTURE.md sección 9. Los esquemas reales viven en
// @jobsradar/contracts (Fase 2, jobsradar-api) — acá solo se re-exportan los
// tipos que la UI necesita, para que ui/ y application/ nunca importen
// directamente del paquete del backend.

export type {
  SearchCriteria,
  Company,
  Founder,
  JobPosting,
  SearchEvent,
} from "@jobsradar/contracts";
