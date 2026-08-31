import { useMemo, useState } from "react";
import { useSearch } from "../application";
import type { SearchCriteria } from "../domain";
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

  // Filtro de ubicación por rol — vive acá (no en SearchForm ni en
  // ResultsTable) porque lo renderiza el formulario (siempre visible,
  // sección 9.1 resultado Fase 11), lo consume la tabla, y también el
  // export (StatusPanel) tiene que coincidir con lo que se ve filtrado.
  const [locationFilter, setLocationFilter] = useState("");

  // Se resetea al arrancar una búsqueda nueva — sin esto, un filtro
  // olvidado de una búsqueda anterior seguía reduciendo en silencio los
  // resultados de la siguiente (bug real reportado por el usuario: "le di
  // a encontrar 20 empresas, solo me trajo 2" — el backend había
  // encontrado 21, el filtro viejo las tapaba casi todas).
  function handleSubmit(criteria: SearchCriteria) {
    setLocationFilter("");
    void start(criteria);
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-slate-950 px-4 py-10 text-slate-100">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-3xl font-semibold">JobsRadar</h1>
        <p className="text-sm text-slate-400">Buscador de empresas remotas en Wellfound</p>
      </div>

      <SearchForm
        onSubmit={handleSubmit}
        disabled={isSearching}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
      />

      <StatusPanel
        status={state.status}
        progress={state.progress}
        failed={state.failed}
        searchId={state.searchId}
        exportPort={exportPort}
        locationFilter={locationFilter}
      />

      {state.status !== "idle" && (
        <div className="w-full max-w-4xl">
          <ResultsTable companies={state.companies} locationFilter={locationFilter} />
        </div>
      )}
    </main>
  );
}

export default App;
