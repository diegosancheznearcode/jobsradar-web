import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchForm } from "./SearchForm";

describe("SearchForm", () => {
  it("llama a onSubmit con el criteria parseado (defaults incluidos)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      jobTitle: "Backend Engineer",
      remoteOnly: true,
      targetCompanies: 50,
    });
  });

  it("muestra un error y no llama a onSubmit si jobTitle es muy corto", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Puesto"), "a");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("solo muestra el campo de ubicación cuando 'Solo remoto' está destildado", async () => {
    const user = userEvent.setup();
    render(<SearchForm onSubmit={vi.fn()} />);

    expect(screen.queryByLabelText("Ubicación")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Solo remoto"));
    expect(screen.getByLabelText("Ubicación")).toBeInTheDocument();
  });

  it("deshabilita los campos y el botón cuando disabled=true", () => {
    render(<SearchForm onSubmit={vi.fn()} disabled />);
    expect(screen.getByLabelText("Puesto")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Buscando…" })).toBeDisabled();
  });
});
