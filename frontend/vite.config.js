import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on the current `mode`
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    // When VITE_API_BASE_URL isn't set (e.g. on Vercel), use "" so calls go to /api on the same site,
    // which vercel.json forwards to the Railway backend. Without this, URLs became "undefined/api/...".
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
