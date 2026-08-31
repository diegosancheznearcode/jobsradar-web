import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Company, SearchEvent } from "../domain";
import type { SearchPort } from "./ports";
import { applySearchEvent, useSearch } from "./useSearch";

const company: Company = {
  slug: "vaulfi-1",
  name: "VaulFi",
  pitch: null,
  size: null,
  market: null,
  websiteUrl: null,
  wellfoundUrl: "https://wellfound.com/company/vaulfi-1",
  founders: [],
  jobs: [],
  extraction: { strategy: "hydrated_state", confidence: 0.6, missing: [] },
};

const idleState = {
  searchId: null,
  status: "idle" as const,
  progress: null,
  companies: [],
  failed: [],
  errorMessage: null,
};

describe("applySearchEvent", () => {
  it("progress actualiza el progreso", () => {
    const event: SearchEvent = { type: "progress", found: 3, target: 50, page: 1 };
    expect(applySearchEvent(idleState, event).progress).toEqual({ found: 3, target: 50, page: 1 });
  });

  it("company.found agrega la empresa a la lista", () => {
    const event: SearchEvent = { type: "company.found", company, rank: 1 };
    expect(applySearchEvent(idleState, event).companies).toEqual([company]);
  });

  it("company.found repetido para el mismo slug reemplaza en vez de duplicar (Wellfound puede repetir una empresa entre páginas)", () => {
    const first: SearchEvent = { type: "company.found", company, rank: 1 };
    const stateWithCompany = applySearchEvent(idleState, first);

    const again: Company = { ...company, market: "Banking" };
    const result = applySearchEvent(stateWithCompany, { type: "company.found", company: again, rank: 2 });

    // Una sola entrada, no dos — bug real: React tiraba "two children with
    // the same key" y la fila se duplicaba en pantalla.
    expect(result.companies).toEqual([again]);
  });

  it("company.updated reemplaza la empresa existente (por slug) con el estado ya mergeado del backend", () => {
    const found: SearchEvent = { type: "company.found", company, rank: 1 };
    const stateWithCompany = applySearchEvent(idleState, found);

    const enriched: Company = { ...company, market: "Banking", websiteUrl: "https://vaulfi.com" };
    const updated = applySearchEvent(stateWithCompany, { type: "company.updated", company: enriched });

    expect(updated.companies).toEqual([enriched]);
  });

  it("company.updated para un slug que no está en la lista lo agrega (fallback seguro)", () => {
    const result = applySearchEvent(idleState, { type: "company.updated", company });
    expect(result.companies).toEqual([company]);
  });

  it("company.failed agrega a la lista de fallidas", () => {
    const event: SearchEvent = { type: "company.failed", slug: "otra-co", reason: "not_found" };
    expect(applySearchEvent(idleState, event).failed).toEqual([{ slug: "otra-co", reason: "not_found" }]);
  });

  it("paused/done/error transicionan el status", () => {
    expect(applySearchEvent(idleState, { type: "paused", reason: "blocked", resumeAt: "x" }).status).toBe("paused");
    expect(applySearchEvent(idleState, { type: "done", total: 50, partial: 2 }).status).toBe("done");

    const errorState = applySearchEvent(idleState, { type: "error", message: "algo falló" });
    expect(errorState.status).toBe("error");
    expect(errorState.errorMessage).toBe("algo falló");
  });

  it("no muta el estado anterior (inmutable)", () => {
    const event: SearchEvent = { type: "company.found", company, rank: 1 };
    const next = applySearchEvent(idleState, event);
    expect(idleState.companies).toEqual([]);
    expect(next).not.toBe(idleState);
  });
});

function fakeSearchPort(): SearchPort & { emit: (event: SearchEvent) => void } {
  let listener: ((event: SearchEvent) => void) | null = null;
  return {
    start: vi.fn().mockResolvedValue({ searchId: "search-1" }),
    subscribe: vi.fn((_searchId, onEvent) => {
      listener = onEvent;
      return vi.fn();
    }),
    emit: (event) => listener?.(event),
  };
}

describe("useSearch", () => {
  it("start() llama a searchPort.start y subscribe, y pasa a status running", async () => {
    const port = fakeSearchPort();
    const { result } = renderHook(() => useSearch(port));

    await act(async () => {
      await result.current.start({ jobTitle: "Backend Engineer", remoteOnly: true, targetCompanies: 50 });
    });

    expect(port.start).toHaveBeenCalledWith({ jobTitle: "Backend Engineer", remoteOnly: true, targetCompanies: 50 });
    expect(port.subscribe).toHaveBeenCalledWith("search-1", expect.any(Function));
    expect(result.current.state.searchId).toBe("search-1");
    expect(result.current.state.status).toBe("running");
  });

  it("los eventos emitidos por subscribe actualizan el estado expuesto", async () => {
    const port = fakeSearchPort();
    const { result } = renderHook(() => useSearch(port));

    await act(async () => {
      await result.current.start({ jobTitle: "Backend Engineer", remoteOnly: true, targetCompanies: 50 });
    });

    act(() => {
      port.emit({ type: "company.found", company, rank: 1 });
    });

    await waitFor(() => {
      expect(result.current.state.companies).toEqual([company]);
    });
  });

  it("desuscribe la sesión anterior si se llama a start() de nuevo", async () => {
    const unsubscribe1 = vi.fn();
    const port: SearchPort = {
      start: vi.fn().mockResolvedValue({ searchId: "search-1" }),
      subscribe: vi.fn().mockReturnValue(unsubscribe1),
    };
    const { result } = renderHook(() => useSearch(port));

    await act(async () => {
      await result.current.start({ jobTitle: "Backend Engineer", remoteOnly: true, targetCompanies: 50 });
    });
    await act(async () => {
      await result.current.start({ jobTitle: "Frontend Engineer", remoteOnly: true, targetCompanies: 50 });
    });

    expect(unsubscribe1).toHaveBeenCalledOnce();
  });
});
