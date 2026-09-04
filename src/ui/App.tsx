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
  const { state, start, reset } = useSearch(searchPort);

  const isSearching = state.status === "starting" || state.status === "running";

  const DEFAULT_TARGET_COMPANIES = "50";

  // Puesto y Cantidad ahora viven acá (antes eran estado interno de
  // SearchForm) — necesario para que el botón "Limpiar" pueda resetearlos
  // desde afuera, igual que ya se hacía con locationFilter.
  const [jobTitle, setJobTitle] = useState("");
  const [targetCompanies, setTargetCompanies] = useState(DEFAULT_TARGET_COMPANIES);

  // Filtro de ubicación por rol — vive acá (no en SearchForm ni en
  // ResultsTable) porque lo renderiza el formulario (siempre visible,
  // sección 9.1 resultado Fase 11), lo consume la tabla, y también el
  // export (StatusPanel) tiene que coincidir con lo que se ve filtrado.
  const [locationFilter, setLocationFilter] = useState("");

  // Pedido explícito del usuario: el filtro de ubicación YA NO se borra al
  // arrancar una búsqueda nueva ("no borres los filtros... cuando le doy
  // consultar quita la ubicacion"). El indicador "Mostrando X de Y" en
  // ResultsTable sigue visible, así que un filtro olvidado de una búsqueda
  // anterior filtrando en silencio la nueva (bug real: "le di a encontrar
  // 20 empresas, solo me trajo 2") queda igual de detectable sin necesidad
  // de resetear el campo.
  function handleSubmit(criteria: SearchCriteria) {
    void start(criteria);
  }

  // Pedido explícito del usuario: botón "Limpiar" que restaura el
  // formulario completo y "elimine las búsquedas" — vuelve useSearch a
  // idle (sin companies/status/progress) además de limpiar los campos.
  function handleReset() {
    setJobTitle("");
    setTargetCompanies(DEFAULT_TARGET_COMPANIES);
    setLocationFilter("");
    reset();
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
        jobTitle={jobTitle}
        onJobTitleChange={setJobTitle}
        targetCompanies={targetCompanies}
        onTargetCompaniesChange={setTargetCompanies}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
      />

      {/* Pedido explícito del usuario: botón que restaura el formulario
          completo y borra la búsqueda actual (vuelve a idle). */}
      <button
        type="button"
        onClick={handleReset}
        disabled={isSearching}
        className="rounded border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Limpiar
      </button>

      <StatusPanel
        status={state.status}
        progress={state.progress}
        failed={state.failed}
        searchId={state.searchId}
        exportPort={exportPort}
        locationFilter={locationFilter}
        errorMessage={state.errorMessage}
      />

      {state.status !== "idle" && (
        // Sin max-width — pedido explícito del usuario: con las columnas
        // que ya tiene la tabla (Empresa/Pitch/Tamaño/Mercado/Sitio/
        // Founders/Ubicación/Publicado/Roles), el ancho angosto de
        // SearchForm/StatusPanel (max-w-xl, arriba) la apretaba de más.
        <div className="w-full">
          <ResultsTable
            companies={state.companies}
            locationFilter={locationFilter}
            onClearLocationFilter={() => setLocationFilter("")}
          />
        </div>
      )}
    </main>
  );
}

export default App;
