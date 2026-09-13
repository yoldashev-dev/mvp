import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import cron from "node-cron";
import "dotenv/config";
import {
  t,
  formatMoney,
  parseAmount,
  DEFAULT_LANG,
  DEFAULT_CURR,
  DEFAULT_THEME,
} from "./i18n.js";

const BOT_TOKEN = process.env.BOT_TOKEN;

let rawBackendUrl = (process.env.BACKEND_URL || "http://localhost:3001").trim().replace(/\/+$/, "");
if (rawBackendUrl && !rawBackendUrl.startsWith("http://") && !rawBackendUrl.startsWith("https://")) {
  rawBackendUrl = `https://${rawBackendUrl}`;
}
const BACKEND_URL = rawBackendUrl;

let rawMiniappUrl = (process.env.MINIAPP_URL || "https://example.com").trim();
if (rawMiniappUrl && !rawMiniappUrl.startsWith("http://") && !rawMiniappUrl.startsWith("https://")) {
  rawMiniappUrl = `https://${rawMiniappUrl}`;
}
const MINIAPP_URL = rawMiniappUrl;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // нужен для голосового ввода (бесплатный тариф)

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN не задан. Возьмите токен у @BotFather и укажите в .env");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const api = axios.create({ baseURL: BACKEND_URL, timeout: 15000 });

// ---- Kesh: foydalanuvchi sozlamalari -------------------------------------
const userCache = new Map();

async function getUserSettings(telegramId) {
  if (userCache.has(telegramId)) {
    return userCache.get(telegramId);
  }
  try {
    const { data } = await api.get(`/api/users/${telegramId}/settings`);
    const settings = {
      language: data.language || DEFAULT_LANG,
      currency: data.currency || DEFAULT_CURR,
      theme: data.theme || DEFAULT_THEME,
    };
    userCache.set(telegramId, settings);
    return settings;
  } catch {
    const fallback = {
      language: DEFAULT_LANG,
      currency: DEFAULT_CURR,
      theme: DEFAULT_THEME,
    };
    userCache.set(telegramId, fallback);
    return fallback;
  }
}

async function updateUserSettings(telegramId, newSettings) {
  const current = await getUserSettings(telegramId);
  const updated = { ...current, ...newSettings };
  userCache.set(telegramId, updated);
  try {
    await api.patch(`/api/users/${telegramId}/settings`, newSettings);
  } catch (err) {
    console.error("Sozlamalarni serverda yangilashda xatolik:", err.message);
  }
  return updated;
}

// ---- Klaviaturalar (Keyboards) ------------------------------------------
function getSettingsKeyboard(lang) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, "btn_change_lang"), "menu:lang")],
    [Markup.button.callback(t(lang, "btn_change_curr"), "menu:curr")],
    [Markup.button.callback(t(lang, "btn_change_theme"), "menu:theme")],
    [Markup.button.callback(t(lang, "btn_close"), "menu:close")],
  ]);
}

function getSettingsMessage(settings) {
  const { language, currency, theme } = settings;
  const langText = t(language, language === "uz" ? "lang_uz" : "lang_ru");
  const currText = t(language, currency === "rub" ? "curr_rub" : "curr_uzs");
  const themeText = t(language, theme === "dark" ? "theme_dark" : "theme_light");

  return (
    `${t(language, "settings_title")}\n\n` +
    `• ${t(language, "settings_lang_label")}: <b>${langText}</b>\n` +
    `• ${t(language, "settings_curr_label")}: <b>${currText}</b>\n` +
    `• ${t(language, "settings_theme_label")}: <b>${themeText}</b>`
  );
}

// ---- /start -------------------------------------------------------------
bot.start(async (ctx) => {
  const { id: telegram_id, first_name, username } = ctx.from;

  try {
    await api.post("/api/users/register", { telegram_id, first_name, username });
  } catch (err) {
    console.error("Ro'yxatdan o'tishda xatolik:", err.message);
  }

  const settings = await getUserSettings(telegram_id);
  const lang = settings.language;

  await ctx.replyWithHTML(
    t(lang, "welcome", first_name),
    Markup.inlineKeyboard([
      [Markup.button.webApp(t(lang, "open_app"), MINIAPP_URL)],
      [Markup.button.callback(t(lang, "btn_change_lang"), "menu:lang")],
    ])
  );
});

// ---- /settings, /sozlamalar, /настройки ---------------------------------
async function showSettings(ctx) {
  const settings = await getUserSettings(ctx.from.id);
  await ctx.replyWithHTML(
    getSettingsMessage(settings),
    getSettingsKeyboard(settings.language)
  );
}

bot.command("settings", showSettings);
bot.command("sozlamalar", showSettings);
bot.command("настройки", showSettings);

// ---- Callback Actions for Settings --------------------------------------
bot.action("menu:settings", async (ctx) => {
  await ctx.answerCbQuery();
  const settings = await getUserSettings(ctx.from.id);
  try {
    await ctx.editMessageText(getSettingsMessage(settings), {
      parse_mode: "HTML",
      ...getSettingsKeyboard(settings.language),
    });
  } catch (e) {
    // xabar o'zgarmagan bo'lsa xatoni e'tiborsiz qoldiramiz
  }
});

bot.action("menu:lang", async (ctx) => {
  await ctx.answerCbQuery();
  const settings = await getUserSettings(ctx.from.id);
  const lang = settings.language;

  await ctx.editMessageText(t(lang, "choose_lang"), {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("🇷🇺 Русский" + (lang === "ru" ? " ✓" : ""), "set_lang:ru"),
        Markup.button.callback("🇺🇿 O'zbekcha" + (lang === "uz" ? " ✓" : ""), "set_lang:uz"),
      ],
      [Markup.button.callback(t(lang, "btn_back"), "menu:settings")],
    ]),
  });
});

bot.action(/^set_lang:(ru|uz)$/, async (ctx) => {
  const newLang = ctx.match[1];
  await ctx.answerCbQuery();
  const updated = await updateUserSettings(ctx.from.id, { language: newLang });

  await ctx.replyWithHTML(t(newLang, "lang_changed"));
  await ctx.editMessageText(getSettingsMessage(updated), {
    parse_mode: "HTML",
    ...getSettingsKeyboard(newLang),
  });
});

bot.action("menu:curr", async (ctx) => {
  await ctx.answerCbQuery();
  const settings = await getUserSettings(ctx.from.id);
  const { language, currency } = settings;

  await ctx.editMessageText(t(language, "choose_curr"), {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("🇺🇿 So'm (UZS)" + (currency === "uzs" ? " ✓" : ""), "set_curr:uzs"),
        Markup.button.callback("🇷🇺 Rubl (₽)" + (currency === "rub" ? " ✓" : ""), "set_curr:rub"),
      ],
      [Markup.button.callback(t(language, "btn_back"), "menu:settings")],
    ]),
  });
});

bot.action(/^set_curr:(uzs|rub)$/, async (ctx) => {
  const newCurr = ctx.match[1];
  await ctx.answerCbQuery();
  const updated = await updateUserSettings(ctx.from.id, { currency: newCurr });

  await ctx.replyWithHTML(t(updated.language, "curr_changed", newCurr));
  await ctx.editMessageText(getSettingsMessage(updated), {
    parse_mode: "HTML",
    ...getSettingsKeyboard(updated.language),
  });
});

bot.action("menu:theme", async (ctx) => {
  await ctx.answerCbQuery();
  const settings = await getUserSettings(ctx.from.id);
  const { language, theme } = settings;

  await ctx.editMessageText(t(language, "choose_theme"), {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback(t(language, "theme_light") + (theme === "light" ? " ✓" : ""), "set_theme:light"),
        Markup.button.callback(t(language, "theme_dark") + (theme === "dark" ? " ✓" : ""), "set_theme:dark"),
      ],
      [Markup.button.callback(t(language, "btn_back"), "menu:settings")],
    ]),
  });
});

bot.action(/^set_theme:(light|dark)$/, async (ctx) => {
  const newTheme = ctx.match[1];
  await ctx.answerCbQuery();
  const updated = await updateUserSettings(ctx.from.id, { theme: newTheme });

  await ctx.replyWithHTML(t(updated.language, "theme_changed", newTheme));
  await ctx.editMessageText(getSettingsMessage(updated), {
    parse_mode: "HTML",
    ...getSettingsKeyboard(updated.language),
  });
});

bot.action("menu:close", async (ctx) => {
  await ctx.answerCbQuery();
  try {
    await ctx.deleteMessage();
  } catch {}
});

bot.action(/^quick:(income|expense):(\d+)$/, async (ctx) => {
  const type = ctx.match[1];
  const amount = parseInt(ctx.match[2], 10);
  const settings = await getUserSettings(ctx.from.id);
  const lang = settings.language;

  try {
    await api.post("/api/transactions", {
      telegram_id: ctx.from.id,
      type,
      amount,
    });
    await ctx.answerCbQuery(lang === "uz" ? "Saqlandi!" : "Сохранено!");
    const moneyStr = formatMoney(amount, settings.currency, lang);
    await ctx.editMessageText(
      type === "income"
        ? t(lang, "income_recorded", moneyStr)
        : t(lang, "expense_recorded", moneyStr),
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("Tranzaksiyani saqlashda xatolik:", err.message);
    await ctx.answerCbQuery(lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка");
  }
});

// ---- Daromad / Доход ----------------------------------------------------
async function handleIncome(ctx) {
  const settings = await getUserSettings(ctx.from.id);
  const amount = parseAmount(ctx.message.text);
  if (!amount) {
    return ctx.replyWithHTML(t(settings.language, "income_format_err"));
  }
  await api.post("/api/transactions", {
    telegram_id: ctx.from.id,
    type: "income",
    amount,
  });
  const moneyStr = formatMoney(amount, settings.currency, settings.language);
  ctx.replyWithHTML(t(settings.language, "income_recorded", moneyStr));
}

bot.command("доход", handleIncome);
bot.command("daromad", handleIncome);

// ---- Xarajat / Расход ---------------------------------------------------
async function handleExpense(ctx) {
  const settings = await getUserSettings(ctx.from.id);
  const amount = parseAmount(ctx.message.text);
  if (!amount) {
    return ctx.replyWithHTML(t(settings.language, "expense_format_err"));
  }
  await api.post("/api/transactions", {
    telegram_id: ctx.from.id,
    type: "expense",
    amount,
  });
  const moneyStr = formatMoney(amount, settings.currency, settings.language);
  ctx.replyWithHTML(t(settings.language, "expense_recorded", moneyStr));
}

bot.command("расход", handleExpense);
bot.command("xarajat", handleExpense);

// ---- Hisobot / Отчет ----------------------------------------------------
async function handleReport(ctx) {
  const settings = await getUserSettings(ctx.from.id);
  const { data } = await api.get("/api/transactions/report/monthly", {
    params: { telegram_id: ctx.from.id },
  });
  const incomeStr = formatMoney(data.income, settings.currency, settings.language);
  const expenseStr = formatMoney(data.expense, settings.currency, settings.language);
  const profitStr = formatMoney(data.profit, settings.currency, settings.language);

  ctx.replyWithHTML(t(settings.language, "report_title", incomeStr, expenseStr, profitStr));
}

bot.command("отчет", handleReport);
bot.command("hisobot", handleReport);

// ---- App tugmasi --------------------------------------------------------
bot.command("app", async (ctx) => {
  const settings = await getUserSettings(ctx.from.id);
  ctx.replyWithHTML(
    t(settings.language, "open_app"),
    Markup.inlineKeyboard([Markup.button.webApp(t(settings.language, "open_app_short"), MINIAPP_URL)])
  );
});

// ---- Ovozli xabarlar (Voice) --------------------------------------------
bot.on("voice", async (ctx) => {
  const settings = await getUserSettings(ctx.from.id);
  const lang = settings.language;

  if (!GEMINI_API_KEY) {
    return ctx.replyWithHTML(t(lang, "voice_not_configured"));
  }

  try {
    const fileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const audioResp = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const base64Audio = Buffer.from(audioResp.data).toString("base64");

    const promptText =
      "Bu tadbirkor/sotuvchining bugungi daromad yoki xarajati haqidagi ovozli xabari (ruscha yoki o'zbekcha bo'lishi mumkin). " +
      "Uning aytgan gapini o'sha tilda so'zma-so'z matnga o'gir. Faqat matnning o'zini javob qilib qaytar, hech qanday qo'shimcha izoh va qo'shtirnoqsiz.";

    let geminiResp;
    try {
      geminiResp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                { inline_data: { mime_type: "audio/ogg", data: base64Audio } },
                { text: promptText },
              ],
            },
          ],
        },
        { timeout: 20000 }
      );
    } catch (apiErr) {
      console.warn("gemini-3.6-flash failed, trying gemini-3.5-flash-lite fallback:", apiErr.response?.data || apiErr.message);
      geminiResp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                { inline_data: { mime_type: "audio/ogg", data: base64Audio } },
                { text: promptText },
              ],
            },
          ],
        },
        { timeout: 20000 }
      );
    }

    const text = (
      geminiResp.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
    ).trim();

    if (!text) {
      return ctx.replyWithHTML(t(lang, "voice_not_heard"));
    }

    const amount = parseAmount(text);
    if (!amount) {
      return ctx.replyWithHTML(t(lang, "voice_no_amount", text));
    }

    const lower = text.toLowerCase();
    const isExpense = /потрат|расход|купил|заплатил|минус|sarfladim|xarajat|ishlatdim|berdim|chiqim|sotib oldim/.test(lower) || text.startsWith("-");
    const isIncome = /заработ|доход|продал|получил|плюс|ishladim|daromad|kirim|sotdim|tushdi|foyda/.test(lower) || text.startsWith("+");

    if (!isExpense && !isIncome) {
      const moneyStr = formatMoney(amount, settings.currency, lang);
      return ctx.replyWithHTML(
        lang === "uz"
          ? `Eshitildi: «<i>${text}</i>»\nSumma: <b>${moneyStr}</b>\nBu daromadmi yoki xarajat?`
          : `Расслышал: «<i>${text}</i>»\nСумма: <b>${moneyStr}</b>\nЭто доход или расход?`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(lang === "uz" ? "💰 Daromad" : "💰 Доход", `quick:income:${amount}`),
            Markup.button.callback(lang === "uz" ? "💸 Xarajat" : "💸 Расход", `quick:expense:${amount}`),
          ],
          [Markup.button.callback(t(lang, "btn_close"), "menu:close")],
        ])
      );
    }

    const type = isExpense ? "expense" : "income";
    await api.post("/api/transactions", { telegram_id: ctx.from.id, type, amount });

    const moneyStr = formatMoney(amount, settings.currency, lang);
    ctx.replyWithHTML(t(lang, "voice_recognized", text, type, moneyStr));
  } catch (err) {
    console.error("Ovozni aniqlashda xatolik:", err.response?.data || err.message);
    ctx.replyWithHTML(t(lang, "voice_error"));
  }
});

// ---- Matnli xabarlar (Oddiy matn: "доход 50000", "расход 20к", "50000" va h.k.) ----
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return; // buyruqlar alohida ishlanadi

  const settings = await getUserSettings(ctx.from.id);
  const lang = settings.language;
  const amount = parseAmount(text);

  if (!amount) {
    // Foydalanuvchi oddiy matn yuborgan (summasiz)
    return ctx.replyWithHTML(
      lang === "uz"
        ? "Yozuv kiritish uchun summani ko'rsating, masalan:\n• <code>Daromad 100 000</code>\n• <code>Xarajat 50 000</code>\nYoki ovozli xabar (ГС) yuboring 🎙"
        : "Чтобы внести запись, укажите сумму, например:\n• <code>Доход 100 000</code>\n• <code>Расход 50 000</code>\nИли просто отправьте голосовое сообщение 🎙"
    );
  }

  const lower = text.toLowerCase();
  const isExpense = /потрат|расход|купил|заплатил|минус|sarfladim|xarajat|ishlatdim|berdim|chiqim|sotib oldim/.test(lower) || text.startsWith("-");
  const isIncome = /заработ|доход|продал|получил|плюс|ishladim|daromad|kirim|sotdim|tushdi|foyda/.test(lower) || text.startsWith("+");

  if (!isExpense && !isIncome) {
    // Faqat raqam yozilgan bo'lsa (masalan: "50000") — tanlash tugmalarini chiqaramiz!
    const moneyStr = formatMoney(amount, settings.currency, lang);
    return ctx.replyWithHTML(
      lang === "uz"
        ? `Summa: <b>${moneyStr}</b>\nBu daromadmi yoki xarajat?`
        : `Сумма: <b>${moneyStr}</b>\nЭто доход или расход?`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(lang === "uz" ? "💰 Daromad" : "💰 Доход", `quick:income:${amount}`),
          Markup.button.callback(lang === "uz" ? "💸 Xarajat" : "💸 Расход", `quick:expense:${amount}`),
        ],
        [Markup.button.callback(t(lang, "btn_close"), "menu:close")],
      ])
    );
  }

  const type = isExpense ? "expense" : "income";
  await api.post("/api/transactions", {
    telegram_id: ctx.from.id,
    type,
    amount,
  });

  const moneyStr = formatMoney(amount, settings.currency, lang);
  ctx.replyWithHTML(
    type === "income"
      ? t(lang, "income_recorded", moneyStr)
      : t(lang, "expense_recorded", moneyStr)
  );
});

// ---- Eslatmalar (Cron) --------------------------------------------------
// 09:00 — Bugungi to'lovlar (ijara va h.k.)
cron.schedule("0 9 * * *", async () => {
  try {
    const { data: due } = await api.get("/api/reminders/due-today");
    for (const reminder of due) {
      const settings = await getUserSettings(reminder.telegram_id);
      const amountText = reminder.amount
        ? ` (~${formatMoney(reminder.amount, settings.currency, settings.language)})`
        : "";
      await bot.telegram.sendMessage(
        reminder.telegram_id,
        t(settings.language, "reminder_text", reminder.title, amountText),
        { parse_mode: "HTML" }
      );
    }
  } catch (err) {
    console.error("Eslatmalarni tarqatishda xatolik:", err.message);
  }
});

// 10:00 — Qaytishi kechikkan qarzlar
cron.schedule("0 10 * * *", async () => {
  try {
    const { data: overdue } = await api.get("/api/debts/overdue");
    for (const debtor of overdue) {
      const settings = await getUserSettings(debtor.telegram_id);
      const balanceStr = formatMoney(debtor.balance, settings.currency, settings.language);
      await bot.telegram.sendMessage(
        debtor.telegram_id,
        t(settings.language, "debt_overdue_text", debtor.name, debtor.due_date, balanceStr),
        { parse_mode: "HTML" }
      );
    }
  } catch (err) {
    console.error("Qarzlarni tekshirishda xatolik:", err.message);
  }
});

// 20:00 — Bugungi yozuv kiritish eslatmasi
cron.schedule("0 20 * * *", async () => {
  try {
    const { data: telegramIds } = await api.get("/api/transactions/no-entry-today");
    for (const telegramId of telegramIds) {
      const settings = await getUserSettings(telegramId);
      await bot.telegram.sendMessage(
        telegramId,
        t(settings.language, "night_reminder"),
        { parse_mode: "HTML" }
      );
    }
  } catch (err) {
    console.error("O'tkazib yuborilgan yozuvlarni tekshirishda xatolik:", err.message);
  }
});

bot.launch();
console.log("RentBot bot muvaffaqiyatli ishga tushdi");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
