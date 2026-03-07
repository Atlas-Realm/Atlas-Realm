const fromTauri = import.meta.env.TAURI_API_BASE_URL;
const fromVite = import.meta.env.VITE_TAURI_API_BASE_URL;

export const API_BASE_URL = (fromTauri || fromVite || "http://127.0.0.1:3000").replace(/\/$/, "");
