import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SseAdapter } from "./SseAdapter";

// jsdom no implementa EventSource — se reemplaza por un doble mínimo que
// captura la URL y permite disparar mensajes a mano desde el test.
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  closed = false;
  url: string;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  emit(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.stubGlobal("EventSource", FakeEventSource);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SseAdapter.subscribe", () => {
  it("abre un EventSource contra la URL del stream de la búsqueda", () => {
    const adapter = new SseAdapter();
    adapter.subscribe("search-1", () => {});

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0]?.url).toBe("http://localhost:3000/api/searches/search-1/stream");
  });

  it("valida cada mensaje contra SearchEventSchema y lo pasa si es válido", () => {
    const adapter = new SseAdapter();
    const onEvent = vi.fn();
    adapter.subscribe("search-1", onEvent);

    FakeEventSource.instances[0]?.emit({ type: "progress", found: 1, target: 50, page: 1 });

    expect(onEvent).toHaveBeenCalledWith({ type: "progress", found: 1, target: 50, page: 1 });
  });

  it("ignora un mensaje que no valida contra el esquema, sin tirar", () => {
    const adapter = new SseAdapter();
    const onEvent = vi.fn();
    adapter.subscribe("search-1", onEvent);

    expect(() => FakeEventSource.instances[0]?.emit({ type: "algo-que-no-existe" })).not.toThrow();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("la función de unsubscribe cierra el EventSource", () => {
    const adapter = new SseAdapter();
    const unsubscribe = adapter.subscribe("search-1", () => {});

    unsubscribe();

    expect(FakeEventSource.instances[0]?.closed).toBe(true);
  });
});
