import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { HttpSearchAdapter } from "./HttpSearchAdapter";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("HttpSearchAdapter.start", () => {
  it("manda POST /api/searches con el criteria y devuelve searchId", async () => {
    let receivedBody: unknown;
    server.use(
      http.post("http://localhost:3000/api/searches", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ searchId: "search-1" }, { status: 202 });
      }),
    );

    const adapter = new HttpSearchAdapter();
    const result = await adapter.start({ jobTitle: "Backend Engineer", remoteOnly: true, targetCompanies: 50 });

    expect(result).toEqual({ searchId: "search-1" });
    expect(receivedBody).toEqual({ jobTitle: "Backend Engineer", remoteOnly: true, targetCompanies: 50 });
  });

  it("tira si el backend responde con error", async () => {
    server.use(http.post("http://localhost:3000/api/searches", () => HttpResponse.json({}, { status: 400 })));

    const adapter = new HttpSearchAdapter();
    await expect(
      adapter.start({ jobTitle: "Backend Engineer", remoteOnly: true, targetCompanies: 50 }),
    ).rejects.toThrow("400");
  });
});
