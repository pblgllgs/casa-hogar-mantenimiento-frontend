import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'icons'
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react')) return 'react-vendor'
            if (id.includes('axios') || id.includes('date-fns')) return 'utils'
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
