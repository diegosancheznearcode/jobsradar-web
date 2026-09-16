import { useMemo, useState } from "react";
import { useSearch } from "../application";
import type { SearchCriteria } from "../domain";
import { CsvExportAdapter, HttpSearchAdapter } from "../infrastructure";
import { Cargando } from "./Cargando";
import { Footer } from "./Footer";
import { ResultsTable } from "./ResultsTable";
import { SearchForm } from "./SearchForm";
import { StatusPanel } from "./StatusPanel";
import { ThemeToggle } from "./ThemeToggle";

// Fase 7 — formulario + tabla + SSE + exportación, cableados vía
// application/useSearch. ui/ solo ve el puerto (SearchPort/ExportPort) y
// el estado ya acumulado, nunca fetch/EventSource directamente (sección 9.1).
function App() {
  const searchPort = useMemo(() => new HttpSearchAdapter(), []);
  const exportPort = useMemo(() => new CsvExportAdapter(), []);
  const { state, start, reset } = useSearch(searchPort);

  const isSearching = state.status === "starting" || state.status === "running";

  // Pedido explícito del usuario: "el spinner no se puede dejar hasta que
  // cargue todo" — status "done" solo significa que el LISTADO terminó, el
  // enriquecimiento en segundo plano (founders/market/website/LinkedIn)
  // puede seguir un rato más (sección 10). Se extiende con
  // enrichmentDone, que llega con el evento SSE "enrichment.done".
  // "paused"/"error" quedan afuera a propósito: StatusPanel ya muestra su
  // propio mensaje para esos casos, y una búsqueda pausada por bloqueo no
  // tiene garantía de que enrichmentDone llegue nunca (no hay reintento
  // automático hoy — ver ARCHITECTURE.md sección 10).
  const showSpinner = isSearching || (state.status === "done" && !state.enrichmentDone);

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

  // Revertido de nuevo por pedido explícito del usuario (2026-09-04): con
  // el filtro persistiendo entre búsquedas, un filtro olvidado de una
  // búsqueda anterior seguía tapando en silencio los resultados de la
  // siguiente ("Mira solo 5/5 empresas... no debería traerme 5 empresas en
  // la visual") — el aviso ámbar + botón "Quitar filtro" en ResultsTable
  // no fueron suficiente mitigación, seguía confundiendo. Vuelve a
  // resetearse al arrancar una búsqueda nueva.
  function handleSubmit(criteria: SearchCriteria) {
    setLocationFilter("");
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
    // max-w-[1100px] vive en el wrapper de acá abajo, NO en <main> — pedido
    // explícito del usuario: la tabla tiene que usar todo el ancho de la
    // ventana, de lado a lado, sin el límite de 1100px que sí aplica al
    // resto del contenido (header/form/panel), calcado de
    // talentradar-frontend. Con las columnas que ya tiene la tabla
    // (Empresa/Descripción/Tamaño/Mercado/Sitio/Founders/Ubicación/
    // Publicado/Roles), 1100px la apretaba de más.
    <main className="mx-auto flex min-h-screen w-full flex-col items-center gap-6 bg-bg px-4 pt-6 pb-16 text-text">
      {/* Pedido explícito del usuario: spinner de pantalla completa hasta
          que TERMINA TODO — el listado y el enriquecimiento en segundo
          plano, no solo el listado (ver showSpinner arriba). */}
      {showSpinner && <Cargando />}

      <div className="flex w-full max-w-[1100px] flex-col items-center gap-6">
        {/* Pedido explícito del usuario: portar el toggle de modo oscuro de
            talentradar-frontend, arriba de todo — igual que en el original. */}
        <div className="flex w-full justify-end">
          <ThemeToggle />
        </div>

        <div className="flex flex-col items-center gap-1">
          {/* Pedido explícito del usuario: logo NEARCODE arriba del título,
              portado de talentradar-frontend (misma pareja claro/oscuro que
              el footer). */}
          <img src="/nearcode-logo.png" alt="NEARCODE" className="logo-claro h-10 w-auto" />
          <img src="/nearcode-logo-dark.png" alt="NEARCODE" className="logo-oscuro h-10 w-auto" />
          <h1 className="text-2xl font-semibold text-primary">JobsRadar</h1>
          <p className="text-sm text-muted">Buscador de empresas remotas en Wellfound</p>
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
          className="rounded-control border border-border bg-panel px-4 py-2 text-sm font-medium text-text hover:bg-bg disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>

      {state.status !== "idle" && (
        <div className="w-full">
          <ResultsTable
            companies={state.companies}
            locationFilter={locationFilter}
            onClearLocationFilter={() => setLocationFilter("")}
          />
        </div>
      )}

      <div className="w-full max-w-[1100px]">
        <Footer />
      </div>
    </main>
  );
}

export default App;
