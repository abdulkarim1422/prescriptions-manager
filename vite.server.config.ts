import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  ssr: {
    target: 'webworker',
    noExternal: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    ssr: true,
    rollupOptions: {
      input: 'src/index.tsx',
      output: {
        format: 'es'
      }
    }
  }
})