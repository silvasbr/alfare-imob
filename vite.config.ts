
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @ts-ignore
const envApiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(envApiKey)
  }
});
