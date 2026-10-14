import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // O servidor de roteiros (Claude API) roda separado em :8787
      "/api": { target: "http://localhost:8787", changeOrigin: true, timeout: 300_000 },
    },
  },
});
