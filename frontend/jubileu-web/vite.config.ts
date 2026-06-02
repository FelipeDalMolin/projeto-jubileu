import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.E2E_API_URL ?? "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
