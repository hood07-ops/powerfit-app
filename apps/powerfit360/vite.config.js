import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
    outDir: resolve(root, '../../dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
          if (id.includes('qrcode')) return 'vendor-qrcode'
          return 'vendor'
        },
      },
    },
  },
})
