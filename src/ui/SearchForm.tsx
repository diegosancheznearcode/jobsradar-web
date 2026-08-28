import { useState } from "react";
import type { FormEvent } from "react";
import { SearchCriteriaSchema } from "../domain";
import type { SearchCriteria } from "../domain";

export interface SearchFormProps {
  onSubmit: (criteria: SearchCriteria) => void;
  disabled?: boolean;
}

// Formulario de búsqueda — ver ARCHITECTURE.md sección 4.1
// (SearchCriteriaSchema) y sección 3 (jobTitle/location/remoteOnly son lo
// que construye la URL del lado del backend; acá solo se valida el
// shape). targetCompanies usa el default del esquema (50) si se deja
// vacío.
export function SearchForm({ onSubmit, disabled }: SearchFormProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [targetCompanies, setTargetCompanies] = useState("50");
  const [maxCompanySize, setMaxCompanySize] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const parsed = SearchCriteriaSchema.safeParse({
      jobTitle,
      location: location.trim() === "" ? undefined : location,
      remoteOnly,
      targetCompanies: targetCompanies === "" ? undefined : Number(targetCompanies),
      maxCompanySize: maxCompanySize === "" ? undefined : Number(maxCompanySize),
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

      <div className="flex items-center gap-2">
        <input
          id="remoteOnly"
          type="checkbox"
          checked={remoteOnly}
          onChange={(e) => setRemoteOnly(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4"
        />
        <label htmlFor="remoteOnly" className="text-sm text-slate-300">
          Solo remoto
        </label>
      </div>

      {!remoteOnly && (
        <div className="flex flex-col gap-1">
          <label htmlFor="location" className="text-sm text-slate-300">
            Ubicación
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bogotá"
            disabled={disabled}
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 disabled:opacity-50"
          />
        </div>
      )}

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

      <div className="flex flex-col gap-1">
        <label htmlFor="maxCompanySize" className="text-sm text-slate-300">
          Tamaño máximo de empresa (empleados, opcional)
        </label>
        <input
          id="maxCompanySize"
          type="number"
          min={1}
          value={maxCompanySize}
          onChange={(e) => setMaxCompanySize(e.target.value)}
          placeholder="Sin límite"
          disabled={disabled}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 disabled:opacity-50"
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
