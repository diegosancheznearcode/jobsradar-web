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
      maxCompanySize: 50,
    });
  });

  it("manda siempre maxCompanySize=50, fijo (sin control en el formulario)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchForm onSubmit={onSubmit} />);

    expect(screen.queryByLabelText(/Tamaño máximo/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ maxCompanySize: 50 }));
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

  it("manda siempre remoteOnly=true, fijo (sin checkbox ni campo de ubicación en el formulario)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchForm onSubmit={onSubmit} />);

    expect(screen.queryByLabelText("Solo remoto")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ubicación")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ remoteOnly: true }));
  });

  it("deshabilita los campos y el botón cuando disabled=true", () => {
    render(<SearchForm onSubmit={vi.fn()} disabled />);
    expect(screen.getByLabelText("Puesto")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Buscando…" })).toBeDisabled();
  });
});
