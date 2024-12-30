import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:4006',
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
                        proxyReq.setHeader('Connection', 'keep-alive');
                    });
                },
                timeout: 300000, // 5 minutes
                proxyTimeout: 300000 // 5 minutes
            }
        },
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    }
})
