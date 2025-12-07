import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = Number(process.env.VITE_PORT) || 3000;
const uploadEndpoint = process.env.VITE_UPLOAD_ENDPOINT;

export default defineConfig({
    plugins: [react()],
    server: {
        port,
        host: true
    },
    define: {
        'import.meta.env.VITE_UPLOAD_ENDPOINT': JSON.stringify(uploadEndpoint),
    }
});
