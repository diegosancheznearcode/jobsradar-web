import { flexRender } from "@tanstack/react-table";
// @tanstack/react-table v9 rediseñó la API (useTable/createTableHook). La
// v8 (useReactTable/createColumnHelper/getCoreRowModel) sigue disponible
// vía este entrypoint /legacy — soporte oficial de migración, no un hack.
import { getCoreRowModel, legacyCreateColumnHelper, useLegacyTable } from "@tanstack/react-table/legacy";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Company } from "../domain";

export interface ResultsTableProps {
  companies: Company[];
}

const columnHelper = legacyCreateColumnHelper<Company>();

// Tabla de resultados — ver ARCHITECTURE.md sección 12 (Fase 7). Recibe
// `companies` ya acumulado por useSearch (vía company.found), no conoce
// SSE ni SearchPort.
export function ResultsTable({ companies }: ResultsTableProps) {
  // El array de columnas va inline dentro de useLegacyTable(), no en una
  // const aparte: v9 (vía /legacy) tiene un problema de varianza en TValue
  // entre columnas heterogéneas cuando el array se tipa/infiere por fuera
  // — el tipado contextual del argumento sí lo resuelve bien acá adentro.
  const table = useLegacyTable({
    data: companies,
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

  if (companies.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay empresas.</p>;
  }

  return (
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
  );
}
