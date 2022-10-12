import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHtmlPlugin } from 'vite-plugin-html'
import envCompatible from 'vite-plugin-env-compatible'

export default defineConfig({
  build: {
    outDir: './build'
  },
  plugins: [
    react(),
    createHtmlPlugin({
      template: './src/index.html'
    }),
    envCompatible({ prefix: '' })
  ]
})
