import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import cron from "node-cron";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const MINIAPP_URL = process.env.MINIAPP_URL || "https://example.com";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // нужен для голосового ввода (бесплатный тариф)

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN не задан. Возьмите токен у @BotFather и укажите в .env");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const api = axios.create({ baseURL: BACKEND_URL });

// ---- /start -------------------------------------------------------------
bot.start(async (ctx) => {
  const { id: telegram_id, first_name, username } = ctx.from;

  await api.post("/api/users/register", { telegram_id, first_name, username });

  await ctx.reply(
    `Привет, ${first_name}! 👋\n\n` +
      `Я помогу вести учёт дохода и расходов твоего бизнеса, буду напоминать про аренду и другие платежи, ` +
      `и подскажу, когда можно накопить на новую покупку для дела — без риска уйти в минус.\n\n` +
      `Первые 7 дней — бесплатно. Дальше 200 000 сум/мес.\n\n` +
      `Открой приложение, чтобы начать:`,
    Markup.inlineKeyboard([
      Markup.button.webApp("📊 Открыть приложение", MINIAPP_URL),
    ])
  );
});

// ---- Быстрый ввод через команды (запасной вариант без Mini App) --------
bot.command("доход", async (ctx) => {
  const amount = parseAmount(ctx.message.text);
  if (!amount) return ctx.reply("Формат: /доход 100000");
  await api.post("/api/transactions", {
    telegram_id: ctx.from.id,
    type: "income",
    amount,
  });
  ctx.reply(`✅ Записал доход: ${format(amount)} сум`);
});

bot.command("расход", async (ctx) => {
  const amount = parseAmount(ctx.message.text);
  if (!amount) return ctx.reply("Формат: /расход 70000");
  await api.post("/api/transactions", {
    telegram_id: ctx.from.id,
    type: "expense",
    amount,
  });
  ctx.reply(`✅ Записал расход: ${format(amount)} сум`);
});

bot.command("отчет", async (ctx) => {
  const { data } = await api.get("/api/transactions/report/monthly", {
    params: { telegram_id: ctx.from.id },
  });
  ctx.reply(
    `📅 За этот месяц:\n` +
      `Заработали: ${format(data.income)} сум\n` +
      `Потратили: ${format(data.expense)} сум\n` +
      `Прибыль: ${format(data.profit)} сум`
  );
});

bot.command("app", (ctx) => {
  ctx.reply(
    "Открыть приложение:",
    Markup.inlineKeyboard([Markup.button.webApp("📊 Открыть", MINIAPP_URL)])
  );
});

// ---- Голосовой ввод: "заработал сто тысяч" / "потратил 50000" ----------
// Требует GEMINI_API_KEY в .env (бесплатный ключ на aistudio.google.com) —
// без него бот вежливо попросит написать текстом.
// Gemini умеет принимать аудио напрямую и сразу возвращать текст —
// отдельный шаг "аудио → текст → анализ" не нужен, как было бы с Whisper.
bot.on("voice", async (ctx) => {
  if (!GEMINI_API_KEY) {
    return ctx.reply(
      "Пока не могу распознавать голос — эта функция ещё не настроена. " +
        "Напишите сумму текстом: /доход 100000 или /расход 50000"
    );
  }

  try {
    const fileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const audioResp = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const base64Audio = Buffer.from(audioResp.data).toString("base64");

    const geminiResp = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { inline_data: { mime_type: "audio/ogg", data: base64Audio } },
              {
                text:
                  "Это голосовое сообщение продавца на рынке о сегодняшнем доходе или расходе. " +
                  "Расшифруй его дословно на русском языке. Ответь ТОЛЬКО текстом расшифровки, " +
                  "без пояснений и кавычек.",
              },
            ],
          },
        ],
      }
    );

    const text = (
      geminiResp.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
    ).trim();

    if (!text) {
      return ctx.reply("Не расслышал голосовое сообщение. Попробуйте ещё раз.");
    }

    const amount = parseAmount(text.toLowerCase());
    if (!amount) {
      return ctx.reply(`Расслышал: «${text}» — но не нашёл сумму. Попробуйте ещё раз.`);
    }

    const lower = text.toLowerCase();
    const isExpense = /потрат|расход|купил|заплатил/.test(lower);
    const isIncome = /заработ|доход|продал|получил/.test(lower);
    const type = isExpense && !isIncome ? "expense" : "income";

    await api.post("/api/transactions", { telegram_id: ctx.from.id, type, amount });

    ctx.reply(
      `Расслышал: «${text}»\n` +
        `✅ Записал ${type === "income" ? "доход" : "расход"}: ${format(amount)} сум`
    );
  } catch (err) {
    console.error("Ошибка распознавания голоса:", err.response?.data || err.message);
    ctx.reply("Не получилось распознать голос. Попробуйте написать текстом.");
  }
});

function parseAmount(text) {
  // Сначала пробуем цифры (100000, 100 000, 100к)
  const digitMatch = text.replace(/\s+/g, "").match(/(\d+)\s*(к|k|тыс)?/i);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    return digitMatch[2] ? num * 1000 : num;
  }

  // Затем — простые числа словами (десять тысяч, сто тысяч, миллион и т.п.)
  const words = {
    один: 1, одна: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5,
    шесть: 6, семь: 7, восемь: 8, девять: 9,
    десять: 10, двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50,
    шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90,
    сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500,
    шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900,
  };
  const multipliers = { тысяча: 1000, тысячи: 1000, тысяч: 1000, миллион: 1000000, млн: 1000000 };

  const tokens = text.split(/\s+/);
  let total = 0;
  let current = 0;
  for (const t of tokens) {
    if (words[t] !== undefined) {
      current += words[t];
    } else if (multipliers[t] !== undefined) {
      total += (current || 1) * multipliers[t];
      current = 0;
    }
  }
  total += current;
  return total > 0 ? total : null;
}

function format(n) {
  return n.toLocaleString("ru-RU");
}

// ---- Ежедневная проверка напоминаний (аренда и т.п.) --------------------
// Запускается каждый день в 09:00 по серверному времени.
cron.schedule("0 9 * * *", async () => {
  try {
    const { data: due } = await api.get("/api/reminders/due-today");
    for (const reminder of due) {
      const amountText = reminder.amount ? ` (~${format(reminder.amount)} сум)` : "";
      await bot.telegram.sendMessage(
        reminder.telegram_id,
        `⏰ Напоминание: сегодня "${reminder.title}"${amountText}. Не забудь внести доход/расход за вчера, если ещё не сделал.`
      );
    }
  } catch (err) {
    console.error("Ошибка при рассылке напоминаний:", err.message);
  }
});

// ---- Просроченные долги — проверка раз в день в 10:00 -------------------
cron.schedule("0 10 * * *", async () => {
  try {
    const { data: overdue } = await api.get("/api/debts/overdue");
    for (const debtor of overdue) {
      await bot.telegram.sendMessage(
        debtor.telegram_id,
        `📌 ${debtor.name} должен был вернуть долг до ${debtor.due_date}, но пока не вернул. ` +
          `Сумма: ${format(debtor.balance)} сум.`
      );
    }
  } catch (err) {
    console.error("Ошибка при проверке просроченных долгов:", err.message);
  }
});

// ---- "Ты забыл внести доход/расход сегодня" — проверка в 20:00 ----------
cron.schedule("0 20 * * *", async () => {
  try {
    const { data: telegramIds } = await api.get("/api/transactions/no-entry-today");
    for (const telegramId of telegramIds) {
      await bot.telegram.sendMessage(
        telegramId,
        "🌙 Похоже, сегодня ты ещё не внёс ни одной записи о доходе или расходе. " +
          "Не забудь — это займёт всего пару секунд."
      );
    }
  } catch (err) {
    console.error("Ошибка при проверке пропущенных записей:", err.message);
  }
});

bot.launch();
console.log("Бот запущен");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
