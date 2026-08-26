import { useMemo } from "react";
import { HttpSearchAdapter } from "../infrastructure";

// Placeholder de Fase 1: solo confirma que ui/ → application/ →
// infrastructure/ están cableados end-to-end (sección 9.1). La UI real
// (formulario de búsqueda, tabla, exportación) llega en la Fase 7.
function App() {
  const searchPort = useMemo(() => new HttpSearchAdapter(), []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-950 text-slate-100">
      <h1 className="text-3xl font-semibold">JobsRadar</h1>
      <p className="text-slate-400">
        Frontend scaffolded (Fase 1) — {searchPort.constructor.name} listo, backend en{" "}
        <code className="rounded bg-slate-800 px-1.5 py-0.5">jobsradar-api</code>.
      </p>
    </main>
  );
}

export default App;
