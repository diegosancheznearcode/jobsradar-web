import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  // Estos tests no verifican nada de la respuesta real del backend (solo
  // comportamiento síncrono del formulario) — mockear fetch evita que el
  // resultado dependa de si hay un backend real corriendo en localhost:3000
  // (bug real: con el backend arriba, el POST llegaba a subscribe() →
  // `new EventSource(...)`, que jsdom no implementa, y tiraba un unhandled
  // rejection que no tenía nada que ver con lo que el test mide).
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch deshabilitado en este test")));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renderiza el encabezado y el formulario de búsqueda (Fase 7)", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "JobsRadar" })).toBeInTheDocument();
    expect(screen.getByLabelText("Puesto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
  });

  it("no muestra el panel de estado ni la tabla antes de buscar", () => {
    render(<App />);
    expect(screen.queryByText(/Todavía no hay empresas/)).not.toBeInTheDocument();
  });

  it('el botón "Limpiar" restaura Puesto y Ubicación a su valor por defecto — pedido explícito del usuario', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.type(screen.getByLabelText(/Ubicación del rol/), "San Mateo");
    expect(screen.getByLabelText("Puesto")).toHaveValue("Backend Engineer");
    expect(screen.getByLabelText(/Ubicación del rol/)).toHaveValue("San Mateo");

    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(screen.getByLabelText("Puesto")).toHaveValue("");
    expect(screen.getByLabelText(/Ubicación del rol/)).toHaveValue("");
  });

  it('el filtro de ubicación se borra solo al arrancar una búsqueda nueva — revertido por pedido explícito del usuario tras confundirse dos veces con un filtro olvidado tapando resultados', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.type(screen.getByLabelText(/Ubicación del rol/), "Los Angeles");
    expect(screen.getByLabelText(/Ubicación del rol/)).toHaveValue("Los Angeles");

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(screen.getByLabelText(/Ubicación del rol/)).toHaveValue("");
  });
});

// Pedido explícito del usuario ("el spinner no se puede dejar hasta que
// cargue todo"): a diferencia del describe de arriba, acá sí hace falta
// simular una búsqueda que arranca y recibe eventos SSE reales, así que
// fetch se mockea para que RESUELVA (no para que falle) y EventSource se
// reemplaza por un fake mínimo (jsdom no lo implementa) cuyo .onmessage se
// puede disparar a mano para empujar eventos por el mismo camino real
// (HttpSearchAdapter → SseAdapter → useSearch) que usa la app.
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  close() {}
}

function emit(event: unknown) {
  const source = FakeEventSource.instances.at(-1);
  source?.onmessage?.({ data: JSON.stringify(event) } as MessageEvent);
}

describe("App — spinner de carga", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ searchId: "search-1" }) }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('se muestra mientras la búsqueda está "running", y sigue mostrándose en "done" hasta que llega "enrichment.done"', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await screen.findByRole("status"); // status "starting"/"running" — Cargando ya está

    emit({ type: "done", total: 1, partial: 0 });
    // "done" (listado) NO alcanza para ocultarlo — el enriquecimiento
    // puede seguir en segundo plano.
    expect(screen.getByRole("status")).toBeInTheDocument();

    emit({ type: "enrichment.done" });
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
