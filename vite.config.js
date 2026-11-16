import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '')

  const ocrKeyGuard = {
    name: 'ocr-key-guard',
    configureServer(server) {
      server.middlewares.use('/api/ocr', (req, res, next) => {
        if (req.method !== 'POST' || env.OCR_SPACE_API_KEY) {
          next()
          return
        }

        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          IsErroredOnProcessing: true,
          ErrorMessage: ['Set OCR_SPACE_API_KEY in .env.local, then restart the Vite server.'],
        }))
      })
    },
  }

  return {
    plugins: [ocrKeyGuard, react(), tailwindcss()],
    server: {
      proxy: {
        '/api/ocr': {
          target: 'https://api.ocr.space',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ocr/, '/parse/image'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.OCR_SPACE_API_KEY) {
                proxyReq.setHeader('apikey', env.OCR_SPACE_API_KEY)
              }
            })
          },
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return

            // These load dynamically — exclude from chunks
            if (id.includes('plotly') || id.includes('react-plotly')) return undefined
            if (id.includes('pdfjs-dist')) return undefined
            if (id.includes('html2pdf')) return undefined
            if (id.includes('mammoth')) return undefined
            if (id.includes('lz-string')) return undefined
            if (id.includes('tesseract')) return undefined

            // Critical path — load first
            if (id.includes('react/') || id.includes('react-dom/')) return 'react-core'
            if (id.includes('react-router')) return 'react-router'

            // Firebase — split into smaller chunks
            if (id.includes('firebase/auth')) return 'firebase-auth'
            if (id.includes('firebase/firestore')) return 'firebase-firestore'
            if (id.includes('firebase/app')) return 'firebase-app'

            // State
            if (id.includes('zustand')) return 'zustand'

            // Math rendering — only loads when Math Mode opens
            if (id.includes('katex') || id.includes('react-katex')) return 'katex'

            // Code highlighting — only loads when Codex opens
            if (id.includes('syntax-highlighter') || id.includes('highlight.js')) return 'syntax'
          },
        },
      },
      minify: 'esbuild',
      target: 'esnext',
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
      ],
      exclude: [
        'pdfjs-dist',
        'html2pdf.js',
        'mammoth',
        'plotly.js-dist-min',
        'tesseract.js',
      ],
    },
  }
})