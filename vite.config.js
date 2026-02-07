import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'your-repo-name' with the actual name of your GitHub repo
export default defineConfig({
  plugins: [react()],
  base: '/caloriecounter/', 
})