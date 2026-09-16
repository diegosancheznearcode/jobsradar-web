import { useState } from "react";
import type { ExportPort } from "../application";
import type { FailedCompany, SearchProgress, SearchStatus } from "../application";

export interface StatusPanelProps {
  status: SearchStatus;
  progress: SearchProgress | null;
  failed: FailedCompany[];
  searchId: string | null;
  exportPort: ExportPort;
  // Mismo filtro que ResultsTable/SearchForm — el export tiene que coincidir
  // con lo que se ve en pantalla (sección 9.1 resultado Fase 11).
  locationFilter: string;
  // useSearch ya lo trackeaba (evento SSE "error") pero nada lo renderizaba
  // — bug real reportado por el usuario ("ayer funcionaba, hoy no"): el
  // backend mandaba un mensaje claro explicando qué pasó, pero la UI solo
  // mostraba el badge genérico "Error" sin ningún detalle.
  errorMessage: string | null;
}

const STATUS_LABEL: Record<SearchStatus, string> = {
  idle: "Sin iniciar",
  starting: "Iniciando…",
  running: "Buscando…",
  paused: "Pausada (bloqueo o límite de tasa)",
  done: "Completada",
  error: "Error",
};

const STATUS_COLOR: Record<SearchStatus, string> = {
  idle: "bg-chip text-muted",
  starting: "bg-warning text-warning-text",
  running: "bg-accent text-on-primary",
  paused: "bg-warning text-warning-text",
  done: "bg-success text-success-text",
  error: "bg-danger-bg text-danger",
};

// Progreso + fallos parciales + exportación — ver ARCHITECTURE.md sección
// 7.1: "Una búsqueda con 47 de 50 empresas es un éxito, no un fallo", por
// eso `failed` se muestra como lista informativa, no como error bloqueante.
export function StatusPanel({
  status,
  progress,
  failed,
  searchId,
  exportPort,
  locationFilter,
  errorMessage,
}: StatusPanelProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!searchId) return;
    setExporting(true);
    try {
      await exportPort.downloadCsv(searchId, locationFilter);
    } finally {
      setExporting(false);
    }
  }

  if (status === "idle") return null;

  return (
    <div className="flex w-full max-w-xl flex-col gap-2 rounded-panel border border-border bg-panel p-4">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        {progress && (
          // "página" acá es la página de listado de Wellfound que el
          // scraper está leyendo (search-list, sección 10) — no hay
          // paginación en la tabla de resultados (se muestran todas las
          // filas juntas). Aclarado tras confusión real del usuario, que
          // interpretó "página 6" como una paginación de la UI inexistente.
          <span className="text-sm text-muted">
            {progress.found} / {progress.target} empresas — revisando página {progress.page} de Wellfound
          </span>
        )}
      </div>

      {status === "error" && errorMessage && (
        <p className="rounded-card border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {failed.length > 0 && (
        <details className="text-sm text-muted">
          <summary className="cursor-pointer">{failed.length} empresa(s) no se pudieron enriquecer</summary>
          <ul className="mt-1 list-inside list-disc">
            {failed.map((f) => (
              <li key={f.slug}>
                {f.slug}: {f.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      {searchId && (status === "done" || status === "paused") && (
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="self-start rounded-control border border-border bg-panel px-3 py-1.5 text-sm text-text hover:bg-bg disabled:opacity-50"
        >
          {exporting ? "Exportando…" : "Exportar CSV"}
        </button>
      )}
    </div>
  );
}
