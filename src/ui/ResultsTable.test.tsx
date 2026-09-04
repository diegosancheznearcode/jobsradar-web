import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Company } from "../domain";
import { ResultsTable } from "./ResultsTable";

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    slug: "vaulfi-1",
    name: "VaulFi",
    pitch: "The Stablecoin Neobank for Emerging Markets",
    size: "1-10 Employees",
    market: "Banking",
    websiteUrl: "https://vaulfi.com",
    linkedinUrl: "https://www.linkedin.com/company/vaulfi",
    wellfoundUrl: "https://wellfound.com/company/vaulfi-1",
    founders: [{ name: "Karim Khattaby", role: "CTO", profileUrl: null, linkedinUrl: null, source: "company_profile" }],
    jobs: [
      {
        externalId: "1",
        title: "Backend Engineer",
        location: "Delaware",
        isRemote: true,
        applyUrl: "https://wellfound.com/jobs/1-backend-engineer",
        postedAt: new Date("2026-08-27T17:45:44Z"),
      },
    ],
    extraction: { strategy: "hydrated_state", confidence: 0.9, missing: [] },
    ...overrides,
  };
}

// onClearLocationFilter no forma parte de lo que testean la mayoría de estos
// casos — se pasa un no-op fijo salvo donde el test lo verifica puntualmente.
const noop = () => {};

describe("ResultsTable", () => {
  it("muestra un mensaje cuando no hay empresas todavía", () => {
    render(<ResultsTable companies={[]} locationFilter="" onClearLocationFilter={noop} />);
    expect(screen.getByText("Todavía no hay empresas.")).toBeInTheDocument();
  });

  it("renderiza una fila por empresa con sus datos", () => {
    render(<ResultsTable companies={[makeCompany()]} locationFilter="" onClearLocationFilter={noop} />);

    expect(screen.getByRole("link", { name: "VaulFi" })).toHaveAttribute(
      "href",
      "https://wellfound.com/company/vaulfi-1",
    );
    expect(screen.getByText("The Stablecoin Neobank for Emerging Markets")).toBeInTheDocument();
    expect(screen.getByText("1-10 Employees")).toBeInTheDocument();
    expect(screen.getByText("Karim Khattaby")).toBeInTheDocument();
    // ubicación del rol: ciudad + "Remote" (el fixture tiene isRemote: true)
    expect(screen.getByText("Delaware, Remote")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // roles abiertos
    // fecha de publicación — pedido explícito del usuario: el dato ya se
    // extraía (job.postedAt), no se mostraba en ningún lado de la tabla.
    expect(screen.getByText(new Date("2026-08-27T17:45:44Z").toLocaleDateString("es"))).toBeInTheDocument();
    // LinkedIn de la EMPRESA — mismo pedido, viendo el ícono junto al
    // Website en la página real de Wellfound.
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/company/vaulfi",
    );
  });

  it("muestra '—' en LinkedIn si la empresa no lo tiene", () => {
    render(<ResultsTable companies={[makeCompany({ linkedinUrl: null })]} locationFilter="" onClearLocationFilter={noop} />);
    expect(screen.queryByRole("link", { name: "LinkedIn" })).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("muestra '—' en Publicado si ningún job tiene postedAt, y la fecha más reciente si hay varios", () => {
    const sinFecha = makeCompany({
      slug: "sin-fecha",
      name: "SinFecha",
      jobs: [{ ...makeCompany().jobs[0]!, postedAt: null }],
    });
    const { rerender } = render(<ResultsTable companies={[sinFecha]} locationFilter="" onClearLocationFilter={noop} />);
    expect(screen.getByText("—")).toBeInTheDocument();

    const dosRoles = makeCompany({
      slug: "dos-roles",
      name: "DosRoles",
      jobs: [
        { ...makeCompany().jobs[0]!, externalId: "1", postedAt: new Date("2026-01-01T00:00:00Z") },
        { ...makeCompany().jobs[0]!, externalId: "2", postedAt: new Date("2026-08-27T17:45:44Z") },
      ],
    });
    rerender(<ResultsTable companies={[dosRoles]} locationFilter="" onClearLocationFilter={noop} />);
    // Se muestra la más reciente de las dos, no la primera del array.
    expect(screen.getByText(new Date("2026-08-27T17:45:44Z").toLocaleDateString("es"))).toBeInTheDocument();
    expect(screen.queryByText(new Date("2026-01-01T00:00:00Z").toLocaleDateString("es"))).not.toBeInTheDocument();
  });

  it("muestra '—' para campos null (market/website/pitch/size)", () => {
    render(
      <ResultsTable
        companies={[makeCompany({ pitch: null, size: null, market: null, websiteUrl: null, founders: [] })]}
        locationFilter=""
        onClearLocationFilter={noop}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(5); // pitch, size, market, website, founders
  });

  it("muestra '—' en Ubicación solo si el job no tiene location NI es remoto", () => {
    render(
      <ResultsTable
        companies={[makeCompany({ jobs: [{ ...makeCompany().jobs[0]!, location: null, isRemote: false }] })]}
        locationFilter=""
        onClearLocationFilter={noop}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("un job remoto sin location muestra 'Remote' (no '—') y se puede filtrar por 'remote'", () => {
    const company = makeCompany({ jobs: [{ ...makeCompany().jobs[0]!, location: null, isRemote: true }] });
    const { rerender } = render(<ResultsTable companies={[company]} locationFilter="" onClearLocationFilter={noop} />);

    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();

    // "remote"/"Remote" son el mismo valor pese a la mayúscula — pedido
    // explícito del usuario ("son homónimos").
    rerender(<ResultsTable companies={[company]} locationFilter="remote" onClearLocationFilter={noop} />);
    expect(screen.getByRole("link", { name: "VaulFi" })).toBeInTheDocument();
  });

  it("filtra por locationFilter (controlado desde afuera, ver SearchForm)", () => {
    const remote = makeCompany({
      slug: "remota",
      name: "Remota",
      jobs: [{ ...makeCompany().jobs[0]!, location: "San Mateo" }],
    });
    const other = makeCompany({
      slug: "otra",
      name: "Otra",
      jobs: [{ ...makeCompany().jobs[0]!, location: "New York City" }],
    });
    const { rerender } = render(<ResultsTable companies={[remote, other]} locationFilter="" onClearLocationFilter={noop} />);

    expect(screen.getByRole("link", { name: "Remota" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Otra" })).toBeInTheDocument();

    rerender(<ResultsTable companies={[remote, other]} locationFilter="san mateo" onClearLocationFilter={noop} />);

    expect(screen.getByRole("link", { name: "Remota" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Otra" })).not.toBeInTheDocument();
  });

  it("un rol remoto sin ciudad propia ('Everywhere' en Wellfound) matchea cualquier filtro de ubicación — Wellfound lo trata como elegible desde cualquier lado", () => {
    const everywhere = makeCompany({
      slug: "peaktew",
      name: "PeakTew",
      jobs: [{ ...makeCompany().jobs[0]!, location: null, isRemote: true }],
    });
    const nyOnly = makeCompany({
      slug: "otra",
      name: "Otra",
      jobs: [{ ...makeCompany().jobs[0]!, location: "New York City", isRemote: false }],
    });

    render(<ResultsTable companies={[everywhere, nyOnly]} locationFilter="los angeles" onClearLocationFilter={noop} />);

    expect(screen.getByRole("link", { name: "PeakTew" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Otra" })).not.toBeInTheDocument();
  });

  it("muestra 'Mostrando X de Y' cuando el filtro reduce los resultados — sin esto un filtro olvidado confundía cuántas empresas encontró la búsqueda", () => {
    const remote = makeCompany({
      slug: "remota",
      name: "Remota",
      jobs: [{ ...makeCompany().jobs[0]!, location: "San Mateo" }],
    });
    const other = makeCompany({
      slug: "otra",
      name: "Otra",
      jobs: [{ ...makeCompany().jobs[0]!, location: "New York City" }],
    });

    const { rerender } = render(<ResultsTable companies={[remote, other]} locationFilter="" onClearLocationFilter={noop} />);
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();

    rerender(<ResultsTable companies={[remote, other]} locationFilter="san mateo" onClearLocationFilter={noop} />);
    expect(screen.getByText(/Mostrando 1 de 2 empresas — filtrado por ubicación/)).toBeInTheDocument();
    // Incluye el valor del filtro activo — pedido implícito del usuario tras
    // confundir un filtro olvidado con un bug de conteo (Fase 12).
    expect(screen.getByText('"san mateo"')).toBeInTheDocument();
  });

  it("muestra un mensaje si ninguna empresa matchea locationFilter", () => {
    render(<ResultsTable companies={[makeCompany()]} locationFilter="ciudad-inexistente" onClearLocationFilter={noop} />);
    expect(screen.getByText("Ninguna empresa tiene un rol en esa ubicación.")).toBeInTheDocument();
  });

  it('el botón "Quitar filtro" del aviso llama a onClearLocationFilter — pedido implícito del usuario tras confundir el filtro persistente con un bug dos veces seguidas', async () => {
    const onClearLocationFilter = vi.fn();
    const remote = makeCompany({
      slug: "remota",
      name: "Remota",
      jobs: [{ ...makeCompany().jobs[0]!, location: "San Mateo" }],
    });
    const other = makeCompany({
      slug: "otra",
      name: "Otra",
      jobs: [{ ...makeCompany().jobs[0]!, location: "New York City" }],
    });

    const user = userEvent.setup();
    render(
      <ResultsTable
        companies={[remote, other]}
        locationFilter="san mateo"
        onClearLocationFilter={onClearLocationFilter}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quitar filtro" }));
    expect(onClearLocationFilter).toHaveBeenCalledOnce();
  });
});
