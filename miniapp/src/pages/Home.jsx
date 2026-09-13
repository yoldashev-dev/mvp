import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage } from "../lib/api.js";
import { hapticImpact } from "../lib/telegram.js";
import { useToast } from "../lib/toast.jsx";
import { useSettings } from "../lib/settingsContext.jsx";
import { AlertIcon, PlusIcon, MinusIcon } from "../components/Icon.jsx";

const EXPENSE_CATEGORIES_RU = ["Аренда", "Товар", "Зарплата", "Коммуналка", "Другое"];
const INCOME_CATEGORIES_RU = ["Продажи", "Услуги", "Другое"];
const EXPENSE_CATEGORIES_UZ = ["Ijara", "Tovarlar", "Oylik", "Kommunal", "Boshqa"];
const INCOME_CATEGORIES_UZ = ["Savdo", "Xizmatlar", "Boshqa"];

export default function Home({ telegramId }) {
  const showToast = useToast();
  const { currencySymbol, language } = useSettings();
  const isUz = language === "uz";

  const [snapshot, setSnapshot] = useState(null);
  const [modal, setModal] = useState(null); // 'income' | 'expense' | null
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(null);
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

  const openModal = (type) => {
    setModal(type);
    setCategory(null);
  };

  const submit = async () => {
    const value = parseInt(amount.replace(/\D/g, ""), 10);
    if (!value) {
      showToast(isUz ? "Summani kiriting" : "Введите сумму");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/transactions", {
        telegram_id: telegramId,
        type: modal,
        amount: value,
        category: category || null,
      });
      hapticImpact("medium");
      setModal(null);
      setAmount("");
      setCategory(null);
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const expCategories = isUz ? EXPENSE_CATEGORIES_UZ : EXPENSE_CATEGORIES_RU;
  const incCategories = isUz ? INCOME_CATEGORIES_UZ : INCOME_CATEGORIES_RU;
  const categories = modal === "income" ? incCategories : expCategories;

  return (
    <div>
      <div className="card">
        <p className="card-title">{isUz ? "30 kunlik foyda" : "Прибыль за 30 дней"}</p>
        <p className="big-number">
          {snapshot ? fmt(snapshot.profit_total) : "…"}
          <span className="sum-unit">{currencySymbol}</span>
        </p>
        {snapshot?.warning && (
          <p className="muted" style={{ color: "var(--accent-alert)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertIcon width={16} height={16} />
            {snapshot.warning}
          </p>
        )}
      </div>

      <div className="action-row">
        <button className="action-btn income" onClick={() => openModal("income")}>
          <PlusIcon width={20} height={20} />
          {isUz ? "Ishladim" : "Заработал"}
        </button>
        <button className="action-btn expense" onClick={() => openModal("expense")}>
          <MinusIcon width={20} height={20} />
          {isUz ? "Sarfladim" : "Потратил"}
        </button>
      </div>

      <div className="card">
        <p className="card-title">{isUz ? "So'nggi yozuvlar" : "Последние записи"}</p>
        {recent.length === 0 && (
          <p className="empty-state">
            {isUz ? "Hozircha yozuvlar yo'q — yuqoridan birinchisini qo'shing" : "Пока нет записей — добавь первую выше"}
          </p>
        )}
        {recent.map((t) => (
          <div className="list-row" key={t.id}>
            <span>
              {t.type === "income" ? (isUz ? "Daromad" : "Доход") : (isUz ? "Xarajat" : "Расход")}
              {t.category && <span className="muted"> · {t.category}</span>}
            </span>
            <span style={{ color: t.type === "income" ? "var(--accent)" : "var(--ink)" }}>
              {t.type === "income" ? "+" : "−"}
              {fmt(t.amount)} {currencySymbol}
            </span>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => !saving && setModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="card-title">
              {modal === "income"
                ? (isUz ? "Bugun qancha ishlab topdingiz?" : "Сколько заработал сегодня?")
                : (isUz ? "Bugun qancha sarfladingiz?" : "Сколько потратил сегодня?")}
            </p>
            <input
              className="field"
              inputMode="numeric"
              autoFocus
              placeholder="100 000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />

            <p className="muted" style={{ margin: "0 0 8px" }}>
              {isUz ? "Kategoriya (ixtiyoriy)" : "Категория (необязательно)"}
            </p>
            <div className="tab-row" style={{ marginBottom: 14 }}>
              {categories.map((c) => (
                <button
                  key={c}
                  className={"tab-btn" + (category === c ? " active" : "")}
                  onClick={() => setCategory(category === c ? null : c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <button className="primary-btn" onClick={submit} disabled={saving}>
              {saving ? (isUz ? "Saqlanmoqda…" : "Сохраняю…") : (isUz ? "Saqlash" : "Сохранить")}
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
          max-height: 85vh; overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
