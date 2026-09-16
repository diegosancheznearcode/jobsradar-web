import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cargando } from "./Cargando";

// Portado de talentradar-frontend — pedido explícito del usuario.
describe("Cargando", () => {
  it('muestra el spinner y el texto "Buscando…" como region de estado accesible', () => {
    render(<Cargando />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Buscando…");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
