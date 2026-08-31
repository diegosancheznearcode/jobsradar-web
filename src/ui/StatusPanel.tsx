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
  idle: "bg-slate-700 text-slate-200",
  starting: "bg-amber-700 text-amber-100",
  running: "bg-sky-700 text-sky-100",
  paused: "bg-amber-700 text-amber-100",
  done: "bg-emerald-700 text-emerald-100",
  error: "bg-red-700 text-red-100",
};

// Progreso + fallos parciales + exportación — ver ARCHITECTURE.md sección
// 7.1: "Una búsqueda con 47 de 50 empresas es un éxito, no un fallo", por
// eso `failed` se muestra como lista informativa, no como error bloqueante.
export function StatusPanel({ status, progress, failed, searchId, exportPort, locationFilter }: StatusPanelProps) {
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
    <div className="flex w-full max-w-xl flex-col gap-2 rounded border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-center justify-between">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        {progress && (
          <span className="text-sm text-slate-400">
            {progress.found} / {progress.target} empresas — página {progress.page}
          </span>
        )}
      </div>

      {failed.length > 0 && (
        <details className="text-sm text-slate-400">
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
          className="self-start rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          {exporting ? "Exportando…" : "Exportar CSV"}
        </button>
      )}
    </div>
  );
}
