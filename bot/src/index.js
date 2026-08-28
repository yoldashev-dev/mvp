import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import cron from "node-cron";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const MINIAPP_URL = process.env.MINIAPP_URL || "https://example.com";

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

function parseAmount(text) {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
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

bot.launch();
console.log("Бот запущен");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
