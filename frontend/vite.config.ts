import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
    },
  },
  optimizeDeps: {
    // Sin esto, el pre-bundling de Vite en dev le da a @vercel/analytics|
    // speed-insights su propia copia de React y los hooks rompen ("Invalid
    // hook call"). Excluidos, resuelven el mismo React que la app. Solo dev:
    // el build de prod (Rollup) ya dedupea bien.
    exclude: ["@vercel/analytics", "@vercel/speed-insights"],
  },
  server: {
    port: 4173,
  },
});
