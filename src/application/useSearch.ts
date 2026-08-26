import { useMutation } from "@tanstack/react-query";
import type { SearchPort } from "./ports";

// Ejemplo mínimo de cómo `ui/` debe consumir `application/`: nunca importa
// HttpSearchAdapter directamente, recibe el puerto por parámetro (inyección
// simple). El caso de uso real (progreso, cancelación, export) llega en la
// Fase 7 — ver ARCHITECTURE.md sección 9.1.
export function useSearch(searchPort: SearchPort) {
  return useMutation({
    mutationFn: (criteria: unknown) => searchPort.start(criteria),
  });
}
