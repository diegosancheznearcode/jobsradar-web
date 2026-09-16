import { useState } from "react";

// Pedido explícito del usuario: portar el toggle de modo oscuro de
// talentradar-frontend (src/lib/theme.js + src/components/ThemeToggle.jsx)
// — mismo mecanismo: atributo `data-theme` en <html> (no una clase), para
// engancharlo directo en CSS con `:root[data-theme="dark"]` y que
// `color-scheme` nativo (scrollbars, inputs) siga el mismo valor.
//
// A propósito, sin persistencia ni preferencia de sistema, igual que el
// original: cada carga de la página arranca en claro siempre; el toggle
// solo cambia la apariencia durante esa sesión.
type Theme = "light" | "dark";

function aplicarTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  function alternar() {
    const siguiente = theme === "dark" ? "light" : "dark";
    aplicarTheme(siguiente);
    setTheme(siguiente);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={theme === "dark"}
      className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs whitespace-nowrap text-text hover:border-primary"
    >
      {theme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro"}
    </button>
  );
}
