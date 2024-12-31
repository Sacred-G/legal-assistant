import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react({
        // Add proper handling for use client directives
        babel: {
            plugins: ['@babel/plugin-syntax-import-assertions']
        }
    })],
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'framer-motion']
                }
            }
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:4006',
                changeOrigin: true,
                secure: false,
                ws: true
            }
        }
    }
})
