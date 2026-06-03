import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { maskSupabaseKey } from "./vite-plugins/maskSupabaseKey";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    maskSupabaseKey({ envVar: "VITE_SUPABASE_PUBLISHABLE_KEY" }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
