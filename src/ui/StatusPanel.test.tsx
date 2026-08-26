import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ExportPort } from "../application";
import { StatusPanel } from "./StatusPanel";

function fakeExportPort(): ExportPort & { downloadCsv: ReturnType<typeof vi.fn> } {
  return { downloadCsv: vi.fn().mockResolvedValue(undefined) };
}

describe("StatusPanel", () => {
  it("no renderiza nada si status es 'idle'", () => {
    const { container } = render(
      <StatusPanel status="idle" progress={null} failed={[]} searchId={null} exportPort={fakeExportPort()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el progreso cuando hay datos", () => {
    render(
      <StatusPanel
        status="running"
        progress={{ found: 3, target: 50, page: 1 }}
        failed={[]}
        searchId="s1"
        exportPort={fakeExportPort()}
      />,
    );
    expect(screen.getByText("3 / 50 empresas — página 1")).toBeInTheDocument();
    expect(screen.getByText("Buscando…")).toBeInTheDocument();
  });

  it("lista las empresas fallidas dentro de un <details>", () => {
    render(
      <StatusPanel
        status="done"
        progress={{ found: 49, target: 50, page: 3 }}
        failed={[{ slug: "otra-co", reason: "not_found" }]}
        searchId="s1"
        exportPort={fakeExportPort()}
      />,
    );
    expect(screen.getByText("1 empresa(s) no se pudieron enriquecer")).toBeInTheDocument();
    expect(screen.getByText("otra-co: not_found")).toBeInTheDocument();
  });

  it("el botón de exportar llama a exportPort.downloadCsv con el searchId", async () => {
    const user = userEvent.setup();
    const exportPort = fakeExportPort();

    render(
      <StatusPanel status="done" progress={{ found: 50, target: 50, page: 3 }} failed={[]} searchId="s1" exportPort={exportPort} />,
    );

    await user.click(screen.getByRole("button", { name: "Exportar CSV" }));
    expect(exportPort.downloadCsv).toHaveBeenCalledWith("s1");
  });

  it("no muestra el botón de exportar mientras status es 'running'", () => {
    render(
      <StatusPanel
        status="running"
        progress={{ found: 3, target: 50, page: 1 }}
        failed={[]}
        searchId="s1"
        exportPort={fakeExportPort()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Exportar CSV" })).not.toBeInTheDocument();
  });
});
