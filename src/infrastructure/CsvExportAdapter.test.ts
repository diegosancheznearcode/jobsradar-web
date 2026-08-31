import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CsvExportAdapter } from "./CsvExportAdapter";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// jsdom no implementa URL.createObjectURL — se stubea para poder probar
// el flujo de descarga sin un navegador real.
beforeEach(() => {
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:fake"), revokeObjectURL: vi.fn() }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CsvExportAdapter.downloadCsv", () => {
  it("pide el CSV y dispara la descarga vía un <a download>", async () => {
    server.use(
      http.get("http://localhost:3000/api/searches/search-1/export", () =>
        HttpResponse.text("slug,name\nvaulfi-1,VaulFi\n", { headers: { "Content-Type": "text/csv" } }),
      ),
    );

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const adapter = new CsvExportAdapter();
    await adapter.downloadCsv("search-1");

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake");

    clickSpy.mockRestore();
  });

  it("manda locationFilter como query param ?location=, para que el export coincida con lo filtrado en pantalla", async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get("http://localhost:3000/api/searches/search-1/export", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.text("slug,name\n", { headers: { "Content-Type": "text/csv" } });
      }),
    );

    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const adapter = new CsvExportAdapter();
    await adapter.downloadCsv("search-1", "San Mateo");

    expect(capturedUrl).toContain("?location=San%20Mateo");
  });

  it("tira si el backend responde con error", async () => {
    server.use(http.get("http://localhost:3000/api/searches/search-1/export", () => HttpResponse.text("", { status: 404 })));

    const adapter = new CsvExportAdapter();
    await expect(adapter.downloadCsv("search-1")).rejects.toThrow("404");
  });
});
