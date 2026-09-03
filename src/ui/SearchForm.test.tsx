import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchForm } from "./SearchForm";

// jobTitle/targetCompanies ahora son props controlados (viven en App.tsx,
// no acá adentro) — pedido explícito del usuario: un botón "Limpiar" en
// App.tsx necesita poder resetearlos desde afuera. Este wrapper simula ese
// dueño externo del estado para que los tests de "escribir en el campo"
// sigan funcionando igual que antes.
function ControlledSearchForm(props: Partial<ComponentProps<typeof SearchForm>>) {
  const [jobTitle, setJobTitle] = useState(props.jobTitle ?? "");
  const [targetCompanies, setTargetCompanies] = useState(props.targetCompanies ?? "50");
  const [locationFilter, setLocationFilter] = useState(props.locationFilter ?? "");

  return (
    <SearchForm
      onSubmit={vi.fn()}
      jobTitle={jobTitle}
      onJobTitleChange={setJobTitle}
      targetCompanies={targetCompanies}
      onTargetCompaniesChange={setTargetCompanies}
      locationFilter={locationFilter}
      onLocationFilterChange={setLocationFilter}
      {...props}
    />
  );
}

function renderForm(overrides: Partial<ComponentProps<typeof SearchForm>> = {}) {
  const onSubmit = vi.fn();
  const onLocationFilterChange = vi.fn();
  const utils = render(
    <ControlledSearchForm onSubmit={onSubmit} onLocationFilterChange={onLocationFilterChange} {...overrides} />,
  );
  return { ...utils, onSubmit, onLocationFilterChange };
}

describe("SearchForm", () => {
  it("llama a onSubmit con el criteria parseado (defaults incluidos)", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

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
    const { onSubmit } = renderForm();

    expect(screen.queryByLabelText(/Tamaño máximo/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ maxCompanySize: 50 }));
  });

  it("muestra un error y no llama a onSubmit si jobTitle es muy corto", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText("Puesto"), "a");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("manda siempre remoteOnly=true, fijo (sin checkbox en el formulario)", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    expect(screen.queryByLabelText("Solo remoto")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ remoteOnly: true }));
  });

  it("el campo de ubicación está siempre visible, junto a Puesto (fila horizontal, pedido explícito del usuario)", () => {
    renderForm();

    const labels = screen.getAllByText(/^(Puesto|Ubicación del rol.*|Cantidad de empresas.*)$/).map((el) => el.textContent);
    expect(labels[0]).toBe("Puesto");
    expect(labels[1]).toMatch(/^Ubicación del rol/);
  });

  it("llama a onLocationFilterChange al escribir en el campo de ubicación (no forma parte de onSubmit)", async () => {
    const user = userEvent.setup();
    const { onLocationFilterChange, onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/Ubicación del rol/), "San Mateo");

    expect(onLocationFilterChange).toHaveBeenCalled();
    // location no es un campo de SearchCriteria acá — es un filtro aparte,
    // nunca termina en el payload de onSubmit (ver ARCHITECTURE.md sección
    // 9.1 resultado Fase 11).
    await user.type(screen.getByLabelText("Puesto"), "Backend Engineer");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    const [payload] = onSubmit.mock.calls[0]!;
    expect(payload).not.toHaveProperty("location");
  });

  it("deshabilita 'Puesto' y el botón cuando disabled=true, pero no el filtro de ubicación", () => {
    renderForm({ disabled: true });
    expect(screen.getByLabelText("Puesto")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Buscando…" })).toBeDisabled();
    expect(screen.getByLabelText(/Ubicación del rol/)).not.toBeDisabled();
  });
});
