import { API_BASE_URL } from "./config";

// Implementa la parte "subscribe" de SearchPort con EventSource sobre
// GET /api/searches/:id/stream (ARCHITECTURE.md sección 7.1). Aislado en su
// propia clase para que cambiar SSE por polling, en el futuro, sea un cambio
// de adaptador, no de componentes (sección 9.1).
export class SseAdapter {
  subscribe(searchId: string, onEvent: (event: unknown) => void): () => void {
    const source = new EventSource(`${API_BASE_URL}/api/searches/${searchId}/stream`);

    source.onmessage = (message) => {
      onEvent(JSON.parse(message.data));
    };

    return () => source.close();
  }
}
