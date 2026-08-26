import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
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
});
