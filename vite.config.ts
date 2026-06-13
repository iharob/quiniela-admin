import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The admin app is served under iaales.lat/admin, so every asset URL must be
// prefixed with /admin/. React Router is configured with the matching
// basename in main.tsx.
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 5174,
  },
})
