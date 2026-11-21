import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "monaco-editor/esm/vs/editor/editor.api.js": "monaco-editor/editor",
        },
    },
    server: {
        proxy: {
            "/socket.io": { target: "http://localhost:3000", ws: true, changeOrigin: true },
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
});
