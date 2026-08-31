import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";

export default function Reminders({ telegramId }) {
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get("/api/reminders", { params: { telegram_id: telegramId } })
      .then((r) => setList(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [telegramId]);

  const create = async () => {
    const d = parseInt(day, 10);
    if (!title.trim()) {
      showToast("Укажите название платежа");
      return;
    }
    if (!d || d < 1 || d > 28) {
      showToast("Число месяца должно быть от 1 до 28");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/reminders", {
        telegram_id: telegramId,
        title: title.trim(),
        amount: amount ? parseInt(amount.replace(/\D/g, ""), 10) : null,
        day_of_month: d,
      });
      setForm(false);
      setTitle("");
      setAmount("");
      setDay("");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/api/reminders/${id}`);
      load();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="card">
        <p className="card-title">Регулярные платежи</p>
        {list.length === 0 && (
          <p className="empty-state">
            Добавь аренду или другой регулярный платёж — напомню в нужный день.
          </p>
        )}
        {list.map((r) => (
          <div className="list-row" key={r.id}>
            <span>
              {r.title} · {r.day_of_month} числа
            </span>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {r.amount ? `${fmt(r.amount)} сум` : ""}
              <button onClick={() => remove(r.id)} className="icon-btn" style={{ color: "var(--accent-red)" }}>
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>

      {!form ? (
        <button className="primary-btn" onClick={() => setForm(true)}>
          Добавить напоминание
        </button>
      ) : (
        <div className="card">
          <input
            className="field"
            placeholder="Например, Аренда"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <input
            className="field"
            inputMode="numeric"
            placeholder="Сумма, сум (необязательно)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="field"
            inputMode="numeric"
            placeholder="Число месяца (1-28)"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="secondary-btn" onClick={() => setForm(false)}>
              Отмена
            </button>
            <button className="primary-btn" onClick={create} disabled={saving}>
              {saving ? "Сохраняю…" : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
