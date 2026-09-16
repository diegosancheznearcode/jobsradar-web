// Portado de talentradar-frontend (src/components/Cargando.jsx) — pedido
// explícito del usuario: overlay de pantalla completa mientras dura la
// búsqueda, en vez de solo deshabilitar el formulario. Bloquea toda la
// pantalla para que no se pueda disparar una segunda búsqueda mientras la
// primera sigue en curso.
export function Cargando() {
  return (
    <div className="overlay-cargando" role="status" aria-live="polite">
      <div className="overlay-cargando-caja">
        <span className="spinner spinner-grande" aria-hidden="true" />
        <p>Buscando…</p>
      </div>
    </div>
  );
}
