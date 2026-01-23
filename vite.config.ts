import { defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      host: '192.168.137.16', // Your network IP
      protocol: 'ws',
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
