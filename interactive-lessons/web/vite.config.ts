import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // PGlite loads its WebAssembly and data files relative to its own module, so it must not be pre-bundled.
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
})
