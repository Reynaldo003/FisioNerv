import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { cwd } from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), 'VITE_')
  const publicApiProxy = {
    target: env.VITE_API_BASE || 'https://api.fisionerv.cloud',
    changeOrigin: true,
    rewrite: (path) => {
      const url = new URL(path, 'http://localhost')
      const endpoint = url.pathname.replace(/^\/backend/, '').replace(/\/?$/, '/')
      return `${endpoint}${url.search}`
    },
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: { proxy: { '/backend': publicApiProxy } },
    preview: { proxy: { '/backend': publicApiProxy } },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
