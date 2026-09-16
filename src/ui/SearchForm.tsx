import { useState, type FormEvent } from "react";
import type { ZodIssue } from "zod";
import { SearchCriteriaSchema } from "../domain";
import type { SearchCriteria } from "../domain";

// Zod trae el mensaje en inglés por default ("Number must be less than or
// equal to 50") — acá se traduce lo que puede fallar en este formulario,
// no un mapeo genérico de todos los códigos de Zod. Bug real reportado por
// el usuario: la búsqueda no arrancaba y no quedaba claro por qué — un
// mensaje en inglés, técnico, era fácil de pasar por alto.
function describeValidationError(issue: ZodIssue | undefined): string {
  if (!issue) return "Datos inválidos.";
  const field = issue.path[0];

  if (field === "targetCompanies") {
    return "La cantidad de empresas a encontrar tiene que ser un número entre 1 y 50.";
  }
  if (field === "jobTitle") {
    return "Escribí un puesto (al menos 2 caracteres).";
  }
  return issue.message;
}

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
      setError(describeValidationError(parsed.error.issues[0]));
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
          <label htmlFor="jobTitle" className="text-sm text-muted">
            Puesto
          </label>
          <input
            id="jobTitle"
            type="text"
            value={jobTitle}
            onChange={(e) => onJobTitleChange(e.target.value)}
            placeholder="Backend Engineer"
            disabled={disabled}
            className="rounded-control border border-border bg-panel px-3 py-2 text-sm text-text placeholder:text-muted disabled:opacity-50"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="locationFilter" className="text-sm text-muted">
            Ubicación del rol (filtra los resultados, opcional)
          </label>
          <input
            id="locationFilter"
            type="text"
            value={locationFilter}
            onChange={(e) => onLocationFilterChange(e.target.value)}
            placeholder="San Mateo"
            className="rounded-control border border-border bg-panel px-3 py-2 text-sm text-text placeholder:text-muted"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="targetCompanies" className="text-sm text-muted">
          Cantidad de empresas a encontrar (1-50)
        </label>
        <input
          id="targetCompanies"
          type="number"
          // Sin min/max nativos, a propósito: un <input type="number"> con
          // min/max hace que el navegador bloquee el evento submit del
          // form ANTES de que React vea el click — nuestro handleSubmit
          // (y el mensaje de error en español de acá abajo) nunca llegaba
          // a ejecutarse para un valor fuera de rango, solo se veía el
          // tooltip nativo del navegador (fácil de pasar por alto) y la
          // búsqueda no arrancaba sin ninguna explicación clara en pantalla.
          // Zod (SearchCriteriaSchema, min/max 1-50) sigue validando el
          // rango igual — ahora es el único validador, con un mensaje
          // consistente con el resto de la UI.
          value={targetCompanies}
          onChange={(e) => onTargetCompaniesChange(e.target.value)}
          // Bug real reportado por el usuario: el campo viene precargado
          // ("50" por default) — sin esto, hacer clic y escribir un número
          // lo AGREGA al final ("5" sobre "50" da "505"), supera el máximo
          // permitido, la validación falla en silencio (ver handleSubmit) y
          // la pantalla se queda mostrando el resultado de la búsqueda
          // anterior, dando la falsa impresión de que ignoró el número
          // nuevo. Seleccionar todo al enfocar hace que escribir siempre
          // reemplace el valor entero, como espera cualquiera al ver un
          // campo numérico ya lleno.
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className="rounded-control border border-border bg-panel px-3 py-2 text-sm text-text disabled:opacity-50"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="rounded-control bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? "Buscando…" : "Buscar"}
      </button>
    </form>
  );
}
