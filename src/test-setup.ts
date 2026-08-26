import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Sin `test.globals: true` en vite.config.ts, @testing-library/react no
// encuentra un `afterEach` global para autoregistrar su cleanup — sin
// esto, el DOM de un `render()` queda montado entre tests del mismo
// archivo y las queries por rol/texto empiezan a matchear más de un
// elemento.
afterEach(() => {
  cleanup();
});
