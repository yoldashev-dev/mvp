import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";
import { useSettings } from "../lib/settingsContext.jsx";
import { hapticImpact } from "../lib/telegram.js";
import { CloseIcon } from "../components/Icon.jsx";

export default function Reminders({ telegramId }) {
  const showToast = useToast();
  const { currencySymbol, language } = useSettings();
  const isUz = language === "uz";
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
      showToast(isUz ? "To'lov nomini kiriting" : "Укажите название платежа");
      return;
    }
    if (!d || d < 1 || d > 28) {
      showToast(isUz ? "Oy kuni 1 dan 28 gacha bo'lishi kerak" : "Число месяца должно быть от 1 до 28");
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
      hapticImpact("medium");
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
      hapticImpact("heavy");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="card">
        <p className="card-title">{isUz ? "Muntazam to'lovlar" : "Регулярные платежи"}</p>
        {list.length === 0 && (
          <p className="empty-state">
            {isUz
              ? "Ijara yoki boshqa muntazam to'lovni qo'shing — kerakli kunda eslataman."
              : "Добавь аренду или другой регулярный платёж — напомню в нужный день."}
          </p>
        )}
        {list.map((r) => (
          <div className="list-row" key={r.id}>
            <span>
              {r.title} · {r.day_of_month} {isUz ? "-kuni" : "числа"}
            </span>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {r.amount ? `${fmt(r.amount)} ${currencySymbol}` : ""}
              <button onClick={() => remove(r.id)} className="icon-btn" style={{ color: "var(--accent-alert)" }}>
                <CloseIcon width={16} height={16} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {!form ? (
        <button className="primary-btn" onClick={() => setForm(true)}>
          {isUz ? "Eslatma qo'shish" : "Добавить напоминание"}
        </button>
      ) : (
        <div className="card">
          <input
            className="field"
            placeholder={isUz ? "Masalan, Ijara" : "Например, Аренда"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <input
            className="field"
            inputMode="numeric"
            placeholder={isUz ? `Summa, ${currencySymbol} (majburiy emas)` : `Сумма, ${currencySymbol} (необязательно)`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            className="field"
            inputMode="numeric"
            placeholder={isUz ? "Oy kuni (1-28)" : "Число месяца (1-28)"}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="secondary-btn" onClick={() => setForm(false)}>
              {isUz ? "Bekor qilish" : "Отмена"}
            </button>
            <button className="primary-btn" onClick={create} disabled={saving}>
              {saving ? (isUz ? "Saqlanmoqda…" : "Сохраняю…") : (isUz ? "Saqlash" : "Сохранить")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
