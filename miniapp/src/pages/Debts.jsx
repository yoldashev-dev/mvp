import React, { useEffect, useState } from "react";
import { api, fmt, errorMessage } from "../lib/api.js";
import { useToast } from "../lib/toast.jsx";
import { useSettings } from "../lib/settingsContext.jsx";
import { hapticImpact } from "../lib/telegram.js";
import { ChevronRightIcon, CloseIcon } from "../components/Icon.jsx";

export default function Debts({ telegramId }) {
  const showToast = useToast();
  const { currencySymbol, language } = useSettings();
  const isUz = language === "uz";

  const [data, setData] = useState(null); // { people: [], total_owed: 0 }
  const [openPerson, setOpenPerson] = useState(null); // debtor_id | null
  const [form, setForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get("/api/debts/people", { params: { telegram_id: telegramId } })
      .then((r) => setData(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [telegramId]);

  const createPerson = async () => {
    const value = amount ? parseInt(amount.replace(/\D/g, ""), 10) : 0;
    if (!name.trim()) {
      showToast(isUz ? "Ismni kiriting" : "Укажите имя");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/debts/people", {
        telegram_id: telegramId,
        name: name.trim(),
        amount: value || undefined,
        due_date: dueDate || undefined,
      });
      hapticImpact("medium");
      setForm(false);
      setName("");
      setAmount("");
      setDueDate("");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!data) return null;

  if (openPerson) {
    return (
      <PersonDetail
        telegramId={telegramId}
        personId={openPerson}
        onBack={() => {
          setOpenPerson(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">{isUz ? "Sizga jami qarz" : "Всего должны вам"}</p>
        <p className="big-number" style={{ color: data.total_owed > 0 ? "var(--accent)" : undefined }}>
          {fmt(data.total_owed)}
          <span className="sum-unit">{currencySymbol}</span>
        </p>
      </div>

      <div className="card">
        <p className="card-title">{isUz ? "Qarzdorlar" : "Люди"}</p>
        {data.people.length === 0 && (
          <p className="empty-state">
            {isUz
              ? "Hozircha hech kim qarzdor emas — qarz berganingizda odam qo'shing."
              : "Пока никто не должен — добавьте человека, когда дадите в долг."}
          </p>
        )}
        {data.people.map((p) => (
          <div className="list-row" key={p.id} style={{ cursor: "pointer" }} onClick={() => setOpenPerson(p.id)}>
            <span>
              {p.name}
              {p.overdue && (
                <span className="pill pill-red" style={{ marginLeft: 8 }}>
                  {isUz ? "muddati o'tgan" : "просрочено"}
                </span>
              )}
            </span>
            <span style={{ color: p.balance > 0 ? "var(--accent)" : "var(--ink)", display: "flex", alignItems: "center", gap: 2 }}>
              {fmt(p.balance)} {currencySymbol}
              <ChevronRightIcon width={16} height={16} style={{ color: "var(--hint)" }} />
            </span>
          </div>
        ))}
      </div>

      {!form ? (
        <button className="primary-btn" onClick={() => setForm(true)}>
          {isUz ? "Qarzdor qo'shish" : "Добавить должника"}
        </button>
      ) : (
        <div className="card">
          <input
            className="field"
            placeholder={isUz ? "Ism, masalan Aziz" : "Имя, например Азиз"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            className="field"
            inputMode="numeric"
            placeholder={isUz ? `Qancha qarz, ${currencySymbol}` : `Сколько должен, ${currencySymbol}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <p className="muted" style={{ margin: "0 0 6px" }}>
            {isUz ? "Qachon qaytarmoqchi (majburiy emas)" : "Когда обещал вернуть (необязательно)"}
          </p>
          <input
            className="field"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="secondary-btn" onClick={() => setForm(false)}>
              {isUz ? "Bekor qilish" : "Отмена"}
            </button>
            <button className="primary-btn" onClick={createPerson} disabled={saving}>
              {saving ? (isUz ? "Saqlanmoqda…" : "Сохраняю…") : (isUz ? "Saqlash" : "Сохранить")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonDetail({ telegramId, personId, onBack }) {
  const showToast = useToast();
  const { currencySymbol, language } = useSettings();
  const isUz = language === "uz";

  const [data, setData] = useState(null); // { debtor, entries, balance }
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDueDate, setEntryDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .get(`/api/debts/people/${personId}`)
      .then((r) => setData(r.data))
      .catch((err) => showToast(errorMessage(err)));
  };

  useEffect(load, [personId]);

  const addEntry = async (type) => {
    const value = parseInt(entryAmount.replace(/\D/g, ""), 10);
    if (!value) {
      showToast(isUz ? "Summani kiriting" : "Введите сумму");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/debts/people/${personId}/entries`, {
        type,
        amount: value,
        due_date: type === "lent" ? entryDueDate || undefined : undefined,
      });
      hapticImpact("medium");
      setEntryAmount("");
      setEntryDueDate("");
      load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removePerson = async () => {
    try {
      await api.delete(`/api/debts/people/${personId}`);
      hapticImpact("heavy");
      onBack();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  if (!data) return null;

  return (
    <div>
      <button className="icon-btn" style={{ padding: "0 0 10px", fontSize: 14, display: "flex", alignItems: "center", gap: 2 }} onClick={onBack}>
        <ChevronRightIcon width={16} height={16} style={{ transform: "rotate(180deg)" }} />
        {isUz ? "Orqaga" : "Назад"}
      </button>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <p className="card-title" style={{ margin: 0 }}>{data.debtor.name}</p>
          <button className="icon-btn" onClick={removePerson} title={isUz ? "Ro'yxatdan o'chirish" : "Убрать из списка"}>
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        <p className="big-number" style={{ color: data.balance > 0 ? "var(--accent)" : "var(--ink)" }}>
          {fmt(data.balance)}
          <span className="sum-unit">
            {currencySymbol} {data.balance > 0 ? (isUz ? "qarz" : "должен") : (isUz ? "qarz yo'q" : "долга нет")}
          </span>
        </p>
        {data.debtor.due_date && data.balance > 0 && (
          <p className={data.debtor.overdue ? "pill pill-red" : "pill pill-gold"} style={{ marginTop: 8, display: "inline-block" }}>
            {data.debtor.overdue ? (isUz ? "muddati o'tdi: " : "просрочено с ") : (isUz ? "qaytarish sanasi: " : "вернуть до ")}
            {data.debtor.due_date}
          </p>
        )}
      </div>

      <div className="card">
        <input
          className="field"
          inputMode="numeric"
          placeholder={isUz ? `Summa, ${currencySymbol}` : `Сумма, ${currencySymbol}`}
          value={entryAmount}
          onChange={(e) => setEntryAmount(e.target.value)}
        />
        <p className="muted" style={{ margin: "0 0 6px" }}>
          {isUz
            ? "Yana qarz bersangiz — yangi qaytarish muddatini ko'rsatishingiz mumkin"
            : "Если снова даёте в долг — можно указать новую дату возврата"}
        </p>
        <input
          className="field"
          type="date"
          value={entryDueDate}
          onChange={(e) => setEntryDueDate(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary-btn" onClick={() => addEntry("repaid")} disabled={saving}>
            {isUz ? "Qaytardi" : "Вернул"}
          </button>
          <button className="primary-btn" onClick={() => addEntry("lent")} disabled={saving}>
            {isUz ? "Yana qarz berdim" : "Дал ещё в долг"}
          </button>
        </div>
      </div>

      <div className="card">
        <p className="card-title">{isUz ? "Tarix" : "История"}</p>
        {data.entries.length === 0 && (
          <p className="empty-state">{isUz ? "Hozircha yozuvlar yo'q" : "Записей пока нет"}</p>
        )}
        {data.entries.map((e) => (
          <div className="list-row" key={e.id}>
            <span>{e.type === "lent" ? (isUz ? "Qarz berildi" : "Дал в долг") : (isUz ? "Qaytarildi" : "Вернул")}</span>
            <span style={{ color: e.type === "lent" ? "var(--ink)" : "var(--accent)" }}>
              {e.type === "lent" ? "+" : "−"}
              {fmt(e.amount)} {currencySymbol}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
