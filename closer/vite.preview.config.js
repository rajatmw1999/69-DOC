// Builds the entire app into ONE self-contained HTML file (preview.html)
// that opens by double-click — no install, no server.
//   npm run build:preview
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-preview',
    chunkSizeWarningLimit: 2000,
  },
})
