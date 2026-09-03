import { useState, type FormEvent } from "react";
import { SearchCriteriaSchema } from "../domain";
import type { SearchCriteria } from "../domain";

export interface SearchFormProps {
  onSubmit: (criteria: SearchCriteria) => void;
  disabled?: boolean;
  // Puesto, Ubicación y Cantidad viven en App.tsx (no acá adentro) —
  // pedido explícito del usuario: un botón "Limpiar" en App.tsx tiene que
  // poder resetear estos tres campos desde afuera, algo que un estado
  // interno de SearchForm no permite sin trucos (remount por key, etc.).
  jobTitle: string;
  onJobTitleChange: (value: string) => void;
  targetCompanies: string;
  onTargetCompaniesChange: (value: string) => void;
  // Filtro de ubicación por rol (job.location, sección 9.1 resultado Fase
  // 11) — se usa en ResultsTable (App.tsx lo levanta y lo pasa a ambos).
  // No es parte de SearchCriteria: no se manda a Wellfound, filtra
  // client-side lo que ya se encontró. Ya NO se resetea al buscar — pedido
  // explícito del usuario, el filtro tiene que sobrevivir entre búsquedas.
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;
}

// Formulario de búsqueda — ver ARCHITECTURE.md sección 4.1
// (SearchCriteriaSchema) y sección 3. targetCompanies usa el default del
// esquema (50) si se deja vacío.
//
// remoteOnly y maxCompanySize fijos por ahora, sin control en el formulario — pedido explícito del
// usuario tras probar los campos editables (ver ARCHITECTURE.md Fase 10).
// remoteOnly=true hace que location nunca se use en buildRoleListingUrl
// (packages/adapter-wellfound/src/urlBuilder.ts) — Wellfound no combina
// remoto + ubicación en una misma búsqueda (confirmado en Fase 0). Por eso
// el campo Ubicación de acá abajo no es el `location` de SearchCriteria:
// es el filtro por job.location (Fase 11).
const FIXED_REMOTE_ONLY = true;
const FIXED_MAX_COMPANY_SIZE = 50;

export function SearchForm({
  onSubmit,
  disabled,
  jobTitle,
  onJobTitleChange,
  targetCompanies,
  onTargetCompaniesChange,
  locationFilter,
  onLocationFilterChange,
}: SearchFormProps) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const parsed = SearchCriteriaSchema.safeParse({
      jobTitle,
      remoteOnly: FIXED_REMOTE_ONLY,
      targetCompanies: targetCompanies === "" ? undefined : Number(targetCompanies),
      maxCompanySize: FIXED_MAX_COMPANY_SIZE,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setError(null);
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-3">
      {/* Puesto + Ubicación en fila, no apiladas — pedido explícito del usuario. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="jobTitle" className="text-sm text-slate-300">
            Puesto
          </label>
          <input
            id="jobTitle"
            type="text"
            value={jobTitle}
            onChange={(e) => onJobTitleChange(e.target.value)}
            placeholder="Backend Engineer"
            disabled={disabled}
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 disabled:opacity-50"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="locationFilter" className="text-sm text-slate-300">
            Ubicación del rol (filtra los resultados, opcional)
          </label>
          <input
            id="locationFilter"
            type="text"
            value={locationFilter}
            onChange={(e) => onLocationFilterChange(e.target.value)}
            placeholder="San Mateo"
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="targetCompanies" className="text-sm text-slate-300">
          Cantidad de empresas a encontrar (1-50)
        </label>
        <input
          id="targetCompanies"
          type="number"
          min={1}
          max={50}
          value={targetCompanies}
          onChange={(e) => onTargetCompaniesChange(e.target.value)}
          disabled={disabled}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 disabled:opacity-50"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="rounded bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? "Buscando…" : "Buscar"}
      </button>
    </form>
  );
}
