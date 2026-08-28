import axios from "axios";

// В проде задайте через переменные окружения Vite (VITE_BACKEND_URL)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const api = axios.create({ baseURL: BACKEND_URL });

export function fmt(n) {
  return Math.round(n || 0).toLocaleString("ru-RU");
}
