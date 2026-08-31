import { useMemo } from "react";
import { flexRender } from "@tanstack/react-table";
// @tanstack/react-table v9 rediseñó la API (useTable/createTableHook). La
// v8 (useReactTable/createColumnHelper/getCoreRowModel) sigue disponible
// vía este entrypoint /legacy — soporte oficial de migración, no un hack.
import { getCoreRowModel, legacyCreateColumnHelper, useLegacyTable } from "@tanstack/react-table/legacy";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Company } from "../domain";

export interface ResultsTableProps {
  companies: Company[];
  // Controlado desde App.tsx (mismo estado que SearchForm renderiza como
  // input) — ver ARCHITECTURE.md sección 9.1 resultado Fase 11: el filtro
  // vive en el formulario, siempre visible, no acá, porque esta tabla no se
  // renderiza hasta que arranca una búsqueda.
  locationFilter: string;
}

const columnHelper = legacyCreateColumnHelper<Company>();

function jobLocations(company: Company): string[] {
  return [...new Set(company.jobs.map((job) => job.location).filter((location): location is string => Boolean(location)))];
}

// Tabla de resultados — ver ARCHITECTURE.md sección 12 (Fase 7). Recibe
// `companies` ya acumulado por useSearch (vía company.found), no conoce
// SSE ni SearchPort.
//
// Filtro de ubicación (pedido explícito del usuario, Fase 10/11): remoteOnly
// queda fijo en SearchForm, así que Wellfound nunca filtra por ubicación en
// la búsqueda misma (sección 3/urlBuilder.ts) — cada JobPosting sí trae su
// propio `location` (ej. "San Mateo", aunque el rol sea remoto), así que el
// filtro se aplica acá, client-side, sobre lo que ya se encontró.
export function ResultsTable({ companies, locationFilter }: ResultsTableProps) {
  const filteredCompanies = useMemo(() => {
    const needle = locationFilter.trim().toLowerCase();
    if (needle === "") return companies;
    return companies.filter((company) =>
      jobLocations(company).some((location) => location.toLowerCase().includes(needle)),
    );
  }, [companies, locationFilter]);

  // El array de columnas va inline dentro de useLegacyTable(), no en una
  // const aparte: v9 (vía /legacy) tiene un problema de varianza en TValue
  // entre columnas heterogéneas cuando el array se tipa/infiere por fuera
  // — el tipado contextual del argumento sí lo resuelve bien acá adentro.
  const table = useLegacyTable({
    data: filteredCompanies,
    columns: [
      columnHelper.accessor("name", {
        header: "Empresa",
        cell: (info) => (
          <a
            href={info.row.original.wellfoundUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sky-400 hover:underline"
          >
            {info.getValue()}
          </a>
        ),
      }),
      columnHelper.accessor("pitch", {
        header: "Pitch",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("size", {
        header: "Tamaño",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("market", {
        header: "Mercado",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("websiteUrl", {
        header: "Sitio",
        cell: (info) => {
          const url = info.getValue();
          return url ? (
            <a href={url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
              {new URL(url).hostname}
            </a>
          ) : (
            "—"
          );
        },
      }),
      columnHelper.accessor("founders", {
        header: "Founders",
        cell: (info) => {
          const founders = info.getValue();
          if (founders.length === 0) return "—";
          return founders.map((f) => f.name).join(", ");
        },
      }),
      columnHelper.accessor((row) => jobLocations(row).join(", "), {
        id: "location",
        header: "Ubicación",
        cell: (info) => info.getValue() || "—",
      }),
      columnHelper.accessor("jobs", {
        header: "Roles abiertos",
        cell: (info) => info.getValue().length,
      }),
      // El cast es por un problema de varianza en TValue en los .d.ts de
      // @tanstack/react-table@9's /legacy shim al unificar columnas
      // heterogéneas en un array — cada accessor de arriba sigue
      // type-checkeado individualmente contra Company; esto solo destraba
      // la unión final.
    ] as unknown as LegacyColumnDef<Company>[],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.slug,
  });

  return (
    <div className="flex w-full flex-col gap-2">
      {companies.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay empresas.</p>
      ) : filteredCompanies.length === 0 ? (
        <p className="text-sm text-slate-500">Ninguna empresa tiene un rol en esa ubicación.</p>
      ) : (
        <div className="w-full overflow-x-auto rounded border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2 font-medium">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-800 text-slate-200">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
