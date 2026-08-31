import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
    wellfoundUrl: "https://wellfound.com/company/vaulfi-1",
    founders: [{ name: "Karim Khattaby", role: "CTO", profileUrl: null, linkedinUrl: null, source: "company_profile" }],
    jobs: [
      {
        externalId: "1",
        title: "Backend Engineer",
        location: "Delaware",
        isRemote: true,
        applyUrl: "https://wellfound.com/jobs/1-backend-engineer",
        postedAt: null,
      },
    ],
    extraction: { strategy: "hydrated_state", confidence: 0.9, missing: [] },
    ...overrides,
  };
}

describe("ResultsTable", () => {
  it("muestra un mensaje cuando no hay empresas todavía", () => {
    render(<ResultsTable companies={[]} locationFilter="" />);
    expect(screen.getByText("Todavía no hay empresas.")).toBeInTheDocument();
  });

  it("renderiza una fila por empresa con sus datos", () => {
    render(<ResultsTable companies={[makeCompany()]} locationFilter="" />);

    expect(screen.getByRole("link", { name: "VaulFi" })).toHaveAttribute(
      "href",
      "https://wellfound.com/company/vaulfi-1",
    );
    expect(screen.getByText("The Stablecoin Neobank for Emerging Markets")).toBeInTheDocument();
    expect(screen.getByText("1-10 Employees")).toBeInTheDocument();
    expect(screen.getByText("Karim Khattaby")).toBeInTheDocument();
    expect(screen.getByText("Delaware")).toBeInTheDocument(); // ubicación del rol
    expect(screen.getByText("1")).toBeInTheDocument(); // roles abiertos
  });

  it("muestra '—' para campos null (market/website/pitch/size)", () => {
    render(
      <ResultsTable
        companies={[makeCompany({ pitch: null, size: null, market: null, websiteUrl: null, founders: [] })]}
        locationFilter=""
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(5); // pitch, size, market, website, founders
  });

  it("muestra '—' en Ubicación si ningún job de la empresa tiene location", () => {
    render(
      <ResultsTable
        companies={[makeCompany({ jobs: [{ ...makeCompany().jobs[0]!, location: null }] })]}
        locationFilter=""
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
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
    const { rerender } = render(<ResultsTable companies={[remote, other]} locationFilter="" />);

    expect(screen.getByRole("link", { name: "Remota" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Otra" })).toBeInTheDocument();

    rerender(<ResultsTable companies={[remote, other]} locationFilter="san mateo" />);

    expect(screen.getByRole("link", { name: "Remota" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Otra" })).not.toBeInTheDocument();
  });

  it("muestra un mensaje si ninguna empresa matchea locationFilter", () => {
    render(<ResultsTable companies={[makeCompany()]} locationFilter="ciudad-inexistente" />);
    expect(screen.getByText("Ninguna empresa tiene un rol en esa ubicación.")).toBeInTheDocument();
  });
});
