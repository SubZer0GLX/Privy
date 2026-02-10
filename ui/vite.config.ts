import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
    base: command === 'build' ? '/ui/dist' : undefined,
    define: {
        global: 'window'
    },
    build: {
        sourcemap: false,
        outDir: 'dist'
    },
    server: {
        port: 3000,
        open: true
    },
    plugins: [react()],
}));
