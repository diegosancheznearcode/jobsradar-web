import { useCallback, useEffect, useRef, useState } from "react";
import type { Company, SearchCriteria, SearchEvent } from "../domain";
import type { SearchPort } from "./ports";

// Caso de uso real de Fase 7 — reemplaza el placeholder de useMutation de
// Fase 1. `ui/` nunca ve SearchPort.subscribe ni los SearchEvent crudos,
// solo este estado ya acumulado. Ver ARCHITECTURE.md sección 7.1 para la
// unión completa de SearchEvent.

export type SearchStatus = "idle" | "starting" | "running" | "paused" | "done" | "error";

export interface SearchProgress {
  found: number;
  target: number;
  page: number;
}

export interface FailedCompany {
  slug: string;
  reason: string;
}

export interface SearchState {
  searchId: string | null;
  status: SearchStatus;
  progress: SearchProgress | null;
  companies: Company[];
  failed: FailedCompany[];
  errorMessage: string | null;
}

const initialState: SearchState = {
  searchId: null,
  status: "idle",
  progress: null,
  companies: [],
  failed: [],
  errorMessage: null,
};

// Reemplaza por slug si ya existe, agrega si es nuevo — usado tanto por
// company.found como por company.updated. Necesario para company.found
// también porque Wellfound puede repetir una empresa entre páginas del
// listado (paginación no perfectamente estable); sin dedup acá, React
// tira "two children with the same key" y la fila puede duplicarse en
// pantalla (bug real, sección 9.1 resultado Fase 11). search-list también
// deduplica del lado del server (evita re-encolar company-detail de más),
// pero la UI tiene que ser robusta igual, no asumir que el server nunca
// manda un found repetido.
function upsertCompany(companies: Company[], company: Company): Company[] {
  const index = companies.findIndex((c) => c.slug === company.slug);
  if (index === -1) return [...companies, company];
  const next = [...companies];
  next[index] = company;
  return next;
}

// Función pura, exportada aparte para poder testear cada transición de
// SearchEvent sin levantar el hook completo.
export function applySearchEvent(state: SearchState, event: SearchEvent): SearchState {
  switch (event.type) {
    case "progress":
      return { ...state, progress: { found: event.found, target: event.target, page: event.page } };
    case "company.found":
      return { ...state, companies: upsertCompany(state.companies, event.company) };
    // El backend ya manda el estado mergeado (no un delta) — upsertCompany
    // solo reemplaza por slug, nunca mergea campo a campo acá (sección 9.1
    // resultado Fase 11: sin este case, la tabla se quedaba para siempre
    // con los datos parciales del company.found original).
    case "company.updated":
      return { ...state, companies: upsertCompany(state.companies, event.company) };
    case "company.failed":
      return { ...state, failed: [...state.failed, { slug: event.slug, reason: event.reason }] };
    case "paused":
      return { ...state, status: "paused" };
    case "done":
      return { ...state, status: "done" };
    case "error":
      return { ...state, status: "error", errorMessage: event.message };
    default:
      return state;
  }
}

export function useSearch(searchPort: SearchPort) {
  const [state, setState] = useState<SearchState>(initialState);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => unsubscribeRef.current?.();
  }, []);

  const start = useCallback(
    async (criteria: SearchCriteria) => {
      unsubscribeRef.current?.();
      setState({ ...initialState, status: "starting" });

      const { searchId } = await searchPort.start(criteria);
      setState((prev) => ({ ...prev, searchId, status: "running" }));

      unsubscribeRef.current = searchPort.subscribe(searchId, (event) => {
        setState((prev) => applySearchEvent(prev, event));
      });
    },
    [searchPort],
  );

  return { state, start };
}
