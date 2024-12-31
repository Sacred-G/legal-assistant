import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

    return {
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
                target: process.env.VITE_API_URL || 'http://localhost:4006',
                changeOrigin: true,
                secure: true,
                ws: true,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            }
        }
    }
    }
})
