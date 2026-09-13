import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: Number(process.env.TOOLSDICE_DEV_PORT ?? 5173),
    strictPort: true,
    proxy: { '/api': process.env.TOOLSDICE_API_PROXY_TARGET ?? 'http://127.0.0.1:3000' },
  },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts', include: ['src/**/*.test.{ts,tsx}'] },
})
