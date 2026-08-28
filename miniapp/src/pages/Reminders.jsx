import React, { useEffect, useState } from "react";
import { api, fmt } from "../lib/api.js";

export default function Reminders({ telegramId }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");

  const load = () => {
    api.get("/api/reminders", { params: { telegram_id: telegramId } }).then((r) => setList(r.data));
  };

  useEffect(load, [telegramId]);

  const create = async () => {
    const d = parseInt(day, 10);
    if (!title || !d || d < 1 || d > 28) return;
    await api.post("/api/reminders", {
      telegram_id: telegramId,
      title,
      amount: amount ? parseInt(amount.replace(/\D/g, ""), 10) : null,
      day_of_month: d,
    });
    setForm(false);
    setTitle("");
    setAmount("");
    setDay("");
    load();
  };

  const remove = async (id) => {
    await api.delete(`/api/reminders/${id}`);
    load();
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
              <button onClick={() => remove(r.id)} style={linkBtn}>
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
          <button className="primary-btn" onClick={create}>
            Сохранить
          </button>
        </div>
      )}
    </div>
  );
}

const linkBtn = {
  border: "none",
  background: "none",
  color: "var(--accent-red)",
  fontSize: 14,
  cursor: "pointer",
};
