import { useState } from "react";
import type { FormEvent } from "react";
import { SearchCriteriaSchema } from "../domain";
import type { SearchCriteria } from "../domain";

export interface SearchFormProps {
  onSubmit: (criteria: SearchCriteria) => void;
  disabled?: boolean;
}

// Formulario de búsqueda — ver ARCHITECTURE.md sección 4.1
// (SearchCriteriaSchema) y sección 3. targetCompanies usa el default del
// esquema (50) si se deja vacío.
//
// remoteOnly y maxCompanySize fijos por ahora, sin control en el formulario — pedido explícito del
// usuario tras probar los campos editables (ver ARCHITECTURE.md Fase 10).
// remoteOnly=true hace que location nunca se use en buildRoleListingUrl
// (packages/adapter-wellfound/src/urlBuilder.ts) — Wellfound no combina
// remoto + ubicación en una misma búsqueda (confirmado en Fase 0), por eso
// el input de Ubicación también se saca del formulario. El filtro de
// ubicación que sí pidió el usuario es sobre la tabla de resultados
// (job.location de cada rol ya encontrado), no sobre esta búsqueda — ver
// ResultsTable.tsx.
const FIXED_REMOTE_ONLY = true;
const FIXED_MAX_COMPANY_SIZE = 50;

export function SearchForm({ onSubmit, disabled }: SearchFormProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [targetCompanies, setTargetCompanies] = useState("50");
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
      setError(parsed.error.issues[0]?.message ?? "Datos de búsqueda inválidos");
      return;
    }

    setError(null);
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="jobTitle" className="text-sm text-slate-300">
          Puesto
        </label>
        <input
          id="jobTitle"
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Backend Engineer"
          disabled={disabled}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 disabled:opacity-50"
        />
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
          onChange={(e) => setTargetCompanies(e.target.value)}
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
