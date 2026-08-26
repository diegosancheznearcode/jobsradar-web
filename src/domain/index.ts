// Tipos de UI derivados de @jobsradar/contracts, sin dependencias de React.
// Ver ARCHITECTURE.md sección 9. Contenido real pendiente: Fase 7, una vez
// @jobsradar/contracts tenga los esquemas reales (Fase 2).

import type { z } from "zod";
import { PlaceholderSchema } from "@jobsradar/contracts";

export type Placeholder = z.infer<typeof PlaceholderSchema>;
