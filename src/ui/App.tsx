import { useMemo } from "react";
import { useSearch } from "../application";
import { CsvExportAdapter, HttpSearchAdapter } from "../infrastructure";
import { ResultsTable } from "./ResultsTable";
import { SearchForm } from "./SearchForm";
import { StatusPanel } from "./StatusPanel";

// Fase 7 — formulario + tabla + SSE + exportación, cableados vía
// application/useSearch. ui/ solo ve el puerto (SearchPort/ExportPort) y
// el estado ya acumulado, nunca fetch/EventSource directamente (sección 9.1).
function App() {
  const searchPort = useMemo(() => new HttpSearchAdapter(), []);
  const exportPort = useMemo(() => new CsvExportAdapter(), []);
  const { state, start } = useSearch(searchPort);

  const isSearching = state.status === "starting" || state.status === "running";

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-slate-950 px-4 py-10 text-slate-100">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-3xl font-semibold">JobsRadar</h1>
        <p className="text-sm text-slate-400">Buscador de empresas remotas en Wellfound</p>
      </div>

      <SearchForm onSubmit={start} disabled={isSearching} />

      <StatusPanel
        status={state.status}
        progress={state.progress}
        failed={state.failed}
        searchId={state.searchId}
        exportPort={exportPort}
      />

      {state.status !== "idle" && (
        <div className="w-full max-w-4xl">
          <ResultsTable companies={state.companies} />
        </div>
      )}
    </main>
  );
}

export default App;
