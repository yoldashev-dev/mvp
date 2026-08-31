import axios from "axios";

// В проде задайте через переменные окружения Vite (VITE_BACKEND_URL)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const api = axios.create({ baseURL: BACKEND_URL, timeout: 15000 });

export function fmt(n) {
  return Math.round(n || 0).toLocaleString("ru-RU");
}

// Единая точка получения текста ошибки — бэкенд теперь всегда отвечает
// JSON-ом вида { error, message }, но на всякий случай подстрахуемся и
// от сетевых сбоев (сервер не отвечает вообще, обрыв связи и т.п.)
export function errorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === "ECONNABORTED") return "Сервер долго не отвечает. Попробуйте ещё раз.";
  if (err?.message === "Network Error") return "Нет связи с сервером. Проверьте интернет.";
  return "Что-то пошло не так. Попробуйте ещё раз.";
}
