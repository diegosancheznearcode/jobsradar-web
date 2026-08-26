import type { ExportPort } from "../application/ports";
import { API_BASE_URL } from "./config";

// Implementa ExportPort contra GET /api/searches/:id/export
// (ARCHITECTURE.md sección 7).
export class CsvExportAdapter implements ExportPort {
  async downloadCsv(searchId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/searches/${searchId}/export`);

    if (!response.ok) {
      throw new Error(`GET /api/searches/${searchId}/export falló con status ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jobsradar-${searchId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
