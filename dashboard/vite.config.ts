import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large dependencies into separate chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
          'charts-vendor': ['recharts'],
          'motion-vendor': ['framer-motion']
        },
      },
    },
  },
})