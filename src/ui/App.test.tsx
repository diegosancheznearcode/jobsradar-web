import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it('el botón "Limpiar" restaura Puesto y Ubicación a su valor por defecto — pedido explícito del usuario', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.type(screen.getByLabelText(/Ubicación del rol/), "San Mateo");
    expect(screen.getByLabelText("Puesto")).toHaveValue("Backend Engineer");
    expect(screen.getByLabelText(/Ubicación del rol/)).toHaveValue("San Mateo");

    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(screen.getByLabelText("Puesto")).toHaveValue("");
    expect(screen.getByLabelText(/Ubicación del rol/)).toHaveValue("");
  });
});
