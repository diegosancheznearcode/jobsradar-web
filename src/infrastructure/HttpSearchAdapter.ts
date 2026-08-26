import type { SearchPort } from "../application/ports";
import { API_BASE_URL } from "./config";
import { SseAdapter } from "./SseAdapter";

// Implementa la mitad "start" de SearchPort contra POST /api/searches
// (ARCHITECTURE.md sección 7). La parte "subscribe" se delega a SseAdapter —
// ver sección 9.1: los componentes nunca ven `fetch` ni `EventSource`.
export class HttpSearchAdapter implements SearchPort {
  private readonly sse = new SseAdapter();

  async start(criteria: unknown): Promise<{ searchId: string }> {
    const response = await fetch(`${API_BASE_URL}/api/searches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(criteria),
    });

    if (!response.ok) {
      throw new Error(`POST /api/searches falló con status ${response.status}`);
    }

    return (await response.json()) as { searchId: string };
  }

  subscribe(searchId: string, onEvent: (event: unknown) => void): () => void {
    return this.sse.subscribe(searchId, onEvent);
  }
}
