/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // El CI clona jobsradar-api como sibling *dentro* de este working
    // directory (jobsradar-api-sibling/, ver .github/workflows/ci.yml) solo
    // para construir @jobsradar/contracts — sin esto, vitest también
    // recoge y corre los tests de ese repo, que no tienen sus propias
    // dependencias instaladas acá.
    exclude: ['**/node_modules/**', '**/jobsradar-api-sibling/**'],
  },
})
