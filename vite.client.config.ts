import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: './src/client.tsx',
      output: {
        entryFileNames: 'client.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  esbuild: {
    jsx: 'automatic',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})