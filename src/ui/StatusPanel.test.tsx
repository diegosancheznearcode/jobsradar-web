import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ExportPort } from "../application";
import { StatusPanel } from "./StatusPanel";

function fakeExportPort(): ExportPort & { downloadCsv: ReturnType<typeof vi.fn> } {
  return { downloadCsv: vi.fn().mockResolvedValue(undefined) };
}

function renderPanel(overrides: Partial<ComponentProps<typeof StatusPanel>> = {}) {
  return render(
    <StatusPanel
      status="idle"
      progress={null}
      failed={[]}
      searchId={null}
      exportPort={fakeExportPort()}
      locationFilter=""
      {...overrides}
    />,
  );
}

describe("StatusPanel", () => {
  it("no renderiza nada si status es 'idle'", () => {
    const { container } = renderPanel();
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el progreso cuando hay datos", () => {
    renderPanel({ status: "running", progress: { found: 3, target: 50, page: 1 }, searchId: "s1" });
    expect(screen.getByText("3 / 50 empresas — página 1")).toBeInTheDocument();
    expect(screen.getByText("Buscando…")).toBeInTheDocument();
  });

  it("lista las empresas fallidas dentro de un <details>", () => {
    renderPanel({
      status: "done",
      progress: { found: 49, target: 50, page: 3 },
      failed: [{ slug: "otra-co", reason: "not_found" }],
      searchId: "s1",
    });
    expect(screen.getByText("1 empresa(s) no se pudieron enriquecer")).toBeInTheDocument();
    expect(screen.getByText("otra-co: not_found")).toBeInTheDocument();
  });

  it("el botón de exportar llama a exportPort.downloadCsv con el searchId y el locationFilter actual", async () => {
    const user = userEvent.setup();
    const exportPort = fakeExportPort();

    renderPanel({
      status: "done",
      progress: { found: 50, target: 50, page: 3 },
      searchId: "s1",
      exportPort,
      locationFilter: "San Mateo",
    });

    await user.click(screen.getByRole("button", { name: "Exportar CSV" }));
    // El export tiene que coincidir con lo que se ve filtrado en pantalla
    // (sección 9.1 resultado Fase 11) — bug real reportado por el usuario.
    expect(exportPort.downloadCsv).toHaveBeenCalledWith("s1", "San Mateo");
  });

  it("no muestra el botón de exportar mientras status es 'running'", () => {
    renderPanel({ status: "running", progress: { found: 3, target: 50, page: 1 }, searchId: "s1" });
    expect(screen.queryByRole("button", { name: "Exportar CSV" })).not.toBeInTheDocument();
  });
});
