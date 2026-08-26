import { SearchEventSchema } from "../domain";
import type { SearchEvent } from "../domain";
import { API_BASE_URL } from "./config";

// Implementa la parte "subscribe" de SearchPort con EventSource sobre
// GET /api/searches/:id/stream (ARCHITECTURE.md sección 7.1). Aislado en su
// propia clase para que cambiar SSE por polling, en el futuro, sea un cambio
// de adaptador, no de componentes (sección 9.1).
//
// Cada mensaje se valida contra SearchEventSchema (Fase 7) — un frame mal
// formado o con un `type` que el frontend todavía no conoce se ignora en
// vez de tirar toda la conexión.
export class SseAdapter {
  subscribe(searchId: string, onEvent: (event: SearchEvent) => void): () => void {
    const source = new EventSource(`${API_BASE_URL}/api/searches/${searchId}/stream`);

    source.onmessage = (message) => {
      const parsed = SearchEventSchema.safeParse(JSON.parse(message.data));
      if (parsed.success) onEvent(parsed.data);
    };

    return () => source.close();
  }
}
