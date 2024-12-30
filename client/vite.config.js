import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
    },
    server: {
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://localhost:4006',
                changeOrigin: true,
                secure: false,
                ws: true,
                xfwd: true,
                rewrite: (path) => path,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('proxyReq', req.url);
                    });
                },
                timeout: 300000, // 5 minutes
                proxyTimeout: 300000 // 5 minutes
            }
        },
        cors: true,
        port: 3000,
        strictPort: true,
    }
})
