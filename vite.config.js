import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return

          // Keep these out — they're dynamically imported
          if (id.includes('plotly') || id.includes('react-plotly')) return undefined
          if (id.includes('pdfjs-dist')) return undefined
          if (id.includes('tesseract')) return undefined
          if (id.includes('html2pdf')) return undefined

          // Bundle these together
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor'
          if (id.includes('firebase')) return 'firebase-vendor'
          if (id.includes('zustand')) return 'zustand-vendor'
          if (id.includes('syntax-highlighter') || id.includes('highlight')) return 'code-vendor'
        },
      },
    },
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
    exclude: ['plotly.js-dist-min', 'react-plotly.js', 'pdfjs-dist', 'tesseract.js', 'html2pdf.js'],
  },
})