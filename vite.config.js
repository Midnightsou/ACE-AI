import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'


export default defineConfig({
  plugins: [react(), tailwindcss(), visualizer({ open: true, filename: 'dist/stats.html' })],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libs into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'zustand-vendor': ['zustand'],
          'katex-vendor': ['katex', 'react-katex'],
          'pdf-vendor': ['pdfjs-dist', 'html2pdf.js'],

        },
      },
    },
    // Compress output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Chunk size warning threshold
    chunkSizeWarningLimit: 1000,
  },
  // Faster dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
})