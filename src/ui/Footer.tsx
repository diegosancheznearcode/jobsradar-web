// Portado de talentradar-frontend (src/components/Footer.jsx) — pedido
// explícito del usuario. Mismo mecanismo de logo claro/oscuro que el
// header: los dos <img> siempre en el DOM, index.css los alterna con
// display:none según data-theme.
export function Footer() {
  return (
    <footer className="mt-10 flex w-full items-center justify-center gap-2 border-t border-border pt-4 text-xs text-muted">
      <img src="/nearcode-logo.png" alt="" aria-hidden="true" className="logo-claro h-4 w-auto opacity-70" />
      <img src="/nearcode-logo-dark.png" alt="" aria-hidden="true" className="logo-oscuro h-4 w-auto opacity-70" />
      <span>© {new Date().getFullYear()} NEARCODE</span>
    </footer>
  );
}
