import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Express API runs on :3001; the Vite dev server serves the React app on
// :5173 and proxies /api requests through to Express.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist",
  },
});
