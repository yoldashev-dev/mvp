import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage } from "../lib/api.js";
import { hapticImpact } from "../lib/telegram.js";
import { useToast } from "../lib/toast.jsx";

export default function Home({ telegramId }) {
  const showToast = useToast();
  const [snapshot, setSnapshot] = useState(null);
  const [modal, setModal] = useState(null); // 'income' | 'expense' | null
  const [amount, setAmount] = useState("");
  const [recent, setRecent] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get("/api/snapshot", { params: { telegram_id: telegramId } })
      .then((r) => setSnapshot(r.data))
      .catch((err) => showToast(errorMessage(err)));
    api
      .get("/api/transactions", { params: { telegram_id: telegramId, limit: 5 } })
      .then((r) => setRecent(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [telegramId]);

  const submit = async () => {
    const value = parseInt(amount.replace(/\D/g, ""), 10);
    if (!value) {
      showToast("Введите сумму");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/transactions", { telegram_id: telegramId, type: modal, amount: value });
      hapticImpact("medium");
      setModal(null);
      setAmount("");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="card">
        <p className="card-title">Прибыль за 30 дней</p>
        <p className="big-number">
          {snapshot ? fmt(snapshot.profit_total) : "…"}
          <span className="sum-unit">сум</span>
        </p>
        {snapshot?.warning && (
          <p className="muted" style={{ color: "var(--accent-red)", marginTop: 8 }}>
            ⚠️ {snapshot.warning}
          </p>
        )}
      </div>

      <div className="action-row">
        <button className="action-btn income" onClick={() => setModal("income")}>
          <span style={{ fontSize: 22 }}>＋</span>
          Заработал
        </button>
        <button className="action-btn expense" onClick={() => setModal("expense")}>
          <span style={{ fontSize: 22 }}>－</span>
          Потратил
        </button>
      </div>

      <div className="card">
        <p className="card-title">Последние записи</p>
        {recent.length === 0 && <p className="empty-state">Пока нет записей — добавь первую выше 👆</p>}
        {recent.map((t) => (
          <div className="list-row" key={t.id}>
            <span>{t.type === "income" ? "Доход" : "Расход"}</span>
            <span style={{ color: t.type === "income" ? "var(--accent-green)" : "var(--accent-red)" }}>
              {t.type === "income" ? "+" : "−"}
              {fmt(t.amount)} сум
            </span>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => !saving && setModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="card-title">
              {modal === "income" ? "Сколько заработал сегодня?" : "Сколько потратил сегодня?"}
            </p>
            <input
              className="field"
              inputMode="numeric"
              autoFocus
              placeholder="Например, 100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button className="primary-btn" onClick={submit} disabled={saving}>
              {saving ? "Сохраняю…" : "Сохранить"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: flex-end; z-index: 50;
        }
        .modal-sheet {
          background: var(--surface); width: 100%; border-radius: 20px 20px 0 0;
          padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
