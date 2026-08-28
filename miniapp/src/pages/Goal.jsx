import React, { useEffect, useState } from "react";
import { api, fmt } from "../lib/api.js";

export default function Goal({ telegramId }) {
  const [data, setData] = useState(undefined); // undefined = загрузка, null = нет цели
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  const load = () => {
    api.get("/api/goals/active", { params: { telegram_id: telegramId } }).then((r) => setData(r.data));
  };

  useEffect(load, [telegramId]);

  const createGoal = async () => {
    const value = parseInt(target.replace(/\D/g, ""), 10);
    if (!title || !value) return;
    await api.post("/api/goals", { telegram_id: telegramId, title, target_amount: value });
    setForm(false);
    setTitle("");
    setTarget("");
    load();
  };

  if (data === undefined) return null;

  if (!data) {
    return (
      <div>
        <div className="card">
          <p className="card-title">Пока нет цели</p>
          <p className="muted">
            Добавь, на что копишь для бизнеса — например, холодильник побольше или новое оборудование.
            Я буду считать, сколько можно откладывать, не уходя в минус.
          </p>
        </div>
        {!form ? (
          <button className="primary-btn" onClick={() => setForm(true)}>
            Добавить цель
          </button>
        ) : (
          <div className="card">
            <input
              className="field"
              placeholder="Например, Холодильник побольше"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="field"
              inputMode="numeric"
              placeholder="Сколько стоит, сум"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <button className="primary-btn" onClick={createGoal}>
              Сохранить цель
            </button>
          </div>
        )}
      </div>
    );
  }

  const { goal, projection } = data;
  const pct = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));

  return (
    <div>
      <div className="card">
        <p className="card-title">{goal.title}</p>
        <p className="big-number">
          {fmt(goal.saved_amount)}
          <span className="sum-unit">/ {fmt(goal.target_amount)} сум</span>
        </p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">{pct}% накоплено</p>
      </div>

      <div className="card">
        <p className="card-title">Рекомендация</p>
        {projection.recommended_monthly_saving > 0 ? (
          <>
            <p style={{ margin: "0 0 8px" }}>
              Можешь откладывать примерно{" "}
              <strong>{fmt(projection.recommended_daily_saving)} сум в день</strong> без риска для бизнеса.
            </p>
            {projection.weeks_to_goal && (
              <p className="muted">
                При таком темпе накопишь на цель примерно за {projection.weeks_to_goal}{" "}
                {weekWord(projection.weeks_to_goal)}.
              </p>
            )}
          </>
        ) : (
          <p className="muted">
            Пока свободных денег на накопление нет — сфокусируйся на том, чтобы прибыль покрывала
            обязательные платежи.
          </p>
        )}
      </div>
    </div>
  );
}

function weekWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "неделю";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "недели";
  return "недель";
}
