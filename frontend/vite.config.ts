import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev only: forward API calls to the FastAPI backend. Production serves
      // both from the same origin, so there is no proxy and no CORS.
      "/api": "http://localhost:8000",
    },
  },
});
