import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

// Portado de talentradar-frontend — pedido explícito del usuario.
describe("ThemeToggle", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it('arranca en claro ("🌙 Modo oscuro") — sin persistencia, siempre arranca así', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "🌙 Modo oscuro" })).toBeInTheDocument();
  });

  it("al hacer click, pasa a oscuro: cambia el texto y setea data-theme en <html>", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "🌙 Modo oscuro" }));

    expect(screen.getByRole("button", { name: "☀️ Modo claro" })).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("un segundo click vuelve a claro", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "🌙 Modo oscuro" }));
    await user.click(screen.getByRole("button", { name: "☀️ Modo claro" }));

    expect(screen.getByRole("button", { name: "🌙 Modo oscuro" })).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
