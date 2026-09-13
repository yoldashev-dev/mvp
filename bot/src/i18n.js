// Lug'at va lokalizatsiya tizimi (Русский / O'zbekcha)

export const DEFAULT_LANG = "ru";
export const DEFAULT_CURR = "uzs";
export const DEFAULT_THEME = "light";

export const MESSAGES = {
  ru: {
    welcome: (name) =>
      `Привет, ${name}! 👋\n\n` +
      `Я помогу вести учёт дохода и расходов твоего бизнеса, буду напоминать про аренду и другие платежи, ` +
      `и подскажу, когда можно накопить на новую покупку для дела — без риска уйти в минус.\n\n` +
      `Первые 7 дней — бесплатно. Дальше 200 000 сум/мес.\n\n` +
      `Открой приложение, чтобы начать:`,
    open_app: "📊 Открыть приложение",
    open_app_short: "📊 Открыть",
    settings_title: "⚙️ <b>Настройки бота</b>\n\nЗдесь вы можете настроить язык, валюту и тему оформления:",
    settings_lang_label: "🌐 Язык",
    settings_curr_label: "💵 Валюта",
    settings_theme_label: "🎨 Тема",
    btn_change_lang: "🌐 Сменить язык",
    btn_change_curr: "💵 Сменить валюту",
    btn_change_theme: "🎨 Сменить тему",
    btn_back: "◀️ Назад",
    btn_close: "❌ Закрыть",
    choose_lang: "🌐 <b>Выберите язык интерфейса:</b>",
    choose_curr: "💵 <b>Выберите основную валюту:</b>",
    choose_theme: "🎨 <b>Выберите тему оформления:</b>",
    lang_changed: "✅ Язык успешно изменён на <b>Русский</b>!",
    curr_changed: (curr) => `✅ Валюта успешно изменена на <b>${curr === "rub" ? "Рубль (₽)" : "Сум (UZS)"}</b>!`,
    theme_changed: (theme) => `✅ Тема оформления изменена на <b>${theme === "dark" ? "Тёмную 🌙" : "Светлую ☀️"}</b>!`,
    income_recorded: (amountStr) => `✅ Записал доход: <b>${amountStr}</b>`,
    expense_recorded: (amountStr) => `✅ Записал расход: <b>${amountStr}</b>`,
    income_format_err: "Формат: /доход 100000 (или /daromad 100000)",
    expense_format_err: "Формат: /расход 70000 (или /xarajat 70000)",
    report_title: (incomeStr, expenseStr, profitStr) =>
      `📅 <b>За этот месяц:</b>\n\n` +
      `📈 Заработали: <b>${incomeStr}</b>\n` +
      `📉 Потратили: <b>${expenseStr}</b>\n` +
      `💰 Прибыль: <b>${profitStr}</b>`,
    voice_not_configured:
      "Пока не могу распознавать голос — эта функция ещё не настроена. " +
      "Напишите сумму текстом: /доход 100000 или /расход 50000",
    voice_not_heard: "Не расслышал голосовое сообщение. Попробуйте ещё раз.",
    voice_no_amount: (text) => `Расслышал: «${text}» — но не нашёл сумму. Попробуйте ещё раз.`,
    voice_recognized: (text, type, amountStr) =>
      `Расслышал: «${text}»\n` +
      `✅ Записал ${type === "income" ? "доход" : "расход"}: <b>${amountStr}</b>`,
    voice_error: "Не получилось распознать голос. Попробуйте написать текстом.",
    reminder_text: (title, amountText) =>
      `⏰ <b>Напоминание:</b> сегодня «${title}»${amountText}. Не забудьте внести доход/расход за вчера, если ещё не сделали.`,
    debt_overdue_text: (name, dueDate, balanceStr) =>
      `📌 <b>${name}</b> должен был вернуть долг до <b>${dueDate}</b>, но пока не вернул.\nСумма: <b>${balanceStr}</b>`,
    night_reminder:
      "🌙 Похоже, сегодня ты ещё не внёс ни одной записи о доходе или расходе. " +
      "Не забудь — это займёт всего пару секунд.",
    theme_light: "☀️ Светлая",
    theme_dark: "🌙 Тёмная",
    lang_ru: "🇷🇺 Русский",
    lang_uz: "🇺🇿 O'zbekcha",
    curr_uzs: "Сум (UZS)",
    curr_rub: "Рубль (₽)",
  },
  uz: {
    welcome: (name) =>
      `Salom, ${name}! 👋\n\n` +
      `Men sizning biznesingiz daromad va xarajatlarini hisoblab borishga, ijara va boshqa to'lovlarni eslatishga ` +
      `hamda yangi xaridlar uchun ortiqcha xavfsiz qachon pul jamg'arishingiz mumkinligini ko'rsatishga yordam beraman.\n\n` +
      `Dastlabki 7 kun — mutlaqo bepul. Keyin 200 000 so'm/oy.\n\n` +
      `Boshlash uchun ilovani oching:`,
    open_app: "📊 Ilovani ochish",
    open_app_short: "📊 Ochish",
    settings_title: "⚙️ <b>Bot sozlamalari</b>\n\nBu yerda til, valyuta va ilova mavzusini tanlashingiz mumkin:",
    settings_lang_label: "🌐 Til",
    settings_curr_label: "💵 Valyuta",
    settings_theme_label: "🎨 Mavzu",
    btn_change_lang: "🌐 Tilni o'zgartirish",
    btn_change_curr: "💵 Valyutani o'zgartirish",
    btn_change_theme: "🎨 Mavzuni o'zgartirish",
    btn_back: "◀️ Orqaga",
    btn_close: "❌ Yopish",
    choose_lang: "🌐 <b>Interfeys tilini tanlang:</b>",
    choose_curr: "💵 <b>Asosiy hisob valyutasini tanlang:</b>",
    choose_theme: "🎨 <b>Ilova mavzusini (ko'rinishini) tanlang:</b>",
    lang_changed: "✅ Til muvaffaqiyatli <b>O'zbekcha</b>ga o'zgartirildi!",
    curr_changed: (curr) => `✅ Asosiy valyuta <b>${curr === "rub" ? "Rubl (₽)" : "So'm (UZS)"}</b>ga o'zgartirildi!`,
    theme_changed: (theme) => `✅ Ilova mavzusi <b>${theme === "dark" ? "Qorong'i 🌙" : "Yorug' ☀️"}</b>ga o'zgartirildi!`,
    income_recorded: (amountStr) => `✅ Daromad saqlandi: <b>${amountStr}</b>`,
    expense_recorded: (amountStr) => `✅ Xarajat saqlandi: <b>${amountStr}</b>`,
    income_format_err: "Format: /daromad 100000 (yoki /доход 100000)",
    expense_format_err: "Format: /xarajat 70000 (yoki /расход 70000)",
    report_title: (incomeStr, expenseStr, profitStr) =>
      `📅 <b>Shu oy bo'yicha hisobot:</b>\n\n` +
      `📈 Ishlandi (daromad): <b>${incomeStr}</b>\n` +
      `📉 Sarflandi (xarajat): <b>${expenseStr}</b>\n` +
      `💰 Sof foyda: <b>${profitStr}</b>`,
    voice_not_configured:
      "Hozircha ovozli xabarni tanish funksiyasi yoqilmagan. " +
      "Iltimos, summani matn shaklida yozing: /daromad 100000 yoki /xarajat 50000",
    voice_not_heard: "Ovozli xabar yaxshi eshitilmadi. Iltimos, qaytadan yuboring.",
    voice_no_amount: (text) => `Eshitildi: «${text}» — lekin summa topilmadi. Qaytadan urinib ko'ring.`,
    voice_recognized: (text, type, amountStr) =>
      `Eshitildi: «${text}»\n` +
      `✅ ${type === "income" ? "Daromad" : "Xarajat"} saqlandi: <b>${amountStr}</b>`,
    voice_error: "Ovozni aniqlab bo'lmadi. Iltimos, summani matn bilan yuboring.",
    reminder_text: (title, amountText) =>
      `⏰ <b>Eslatma:</b> bugun «${title}» to'lovi kuni${amountText}. Agar kiritmagan bo'lsangiz, kechagi daromad va xarajatlarni yozib qo'ying.`,
    debt_overdue_text: (name, dueDate, balanceStr) =>
      `📌 <b>${name}</b> qarzni <b>${dueDate}</b> gacha qaytarishi kerak edi, lekin hali qaytarmadi.\nQarz summasi: <b>${balanceStr}</b>`,
    night_reminder:
      "🌙 Bugun hali birorta ham daromad yoki xarajat yozmadingiz shekilli. " +
      "Unutmang — bu bir necha soniya vaqtingizni oladi xolos.",
    theme_light: "☀️ Yorug'",
    theme_dark: "🌙 Qorong'i",
    lang_ru: "🇷🇺 Русский",
    lang_uz: "🇺🇿 O'zbekcha",
    curr_uzs: "So'm (UZS)",
    curr_rub: "Rubl (₽)",
  },
};

export function t(lang, key, ...args) {
  const selectedLang = MESSAGES[lang] ? lang : DEFAULT_LANG;
  const val = MESSAGES[selectedLang][key] || MESSAGES[DEFAULT_LANG][key];
  if (typeof val === "function") {
    return val(...args);
  }
  return val || key;
}

export function formatMoney(amount, currency = "uzs", lang = "ru") {
  const formatted = Math.round(amount || 0).toLocaleString("ru-RU");
  if (currency === "rub") {
    return `${formatted} ₽`;
  }
  return lang === "uz" ? `${formatted} so'm` : `${formatted} сум`;
}

// So'zlar orqali sonlarni topish (ruscha va o'zbekcha)
const NUMBER_WORDS = {
  // Ruscha
  один: 1, одна: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5,
  шесть: 6, семь: 7, восемь: 8, девять: 9,
  десять: 10, двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50,
  шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90,
  сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500,
  шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900,

  // O'zbekcha
  bir: 1, ikki: 2, uch: 3, turt: 4, "to'rt": 4, tort: 4, besh: 5,
  olti: 6, yetti: 7, etti: 7, sakkiz: 8, tuqqiz: 9, "to'qqiz": 9, toqqiz: 9,
  on: 10, "o'n": 10, yigirma: 20, uttiz: 30, "o'ttiz": 30, qirq: 40, ellik: 50,
  oltmish: 60, yetmish: 70, etmish: 70, sakson: 80, tuqson: 90, "to'qson": 90, toqson: 90,
};

const MULTIPLIERS = {
  // Ruscha
  тысяча: 1000, тысячи: 1000, тысяч: 1000,
  миллион: 1000000, миллиона: 1000000, миллионов: 1000000, млн: 1000000,
  // O'zbekcha
  yuz: 100, ming: 1000, mln: 1000000, million: 1000000,
  // Umumiy
  к: 1000, k: 1000,
};

export function parseAmount(text) {
  if (!text) return null;
  const clean = text.toLowerCase().replace(/['`ʻ’]/g, "'");

  // 1. Raqamlar (100000, 100 000, 100k, 50 ming, 2.5 mln, 2.5 млн)
  const digitMatch = clean.replace(/\s+/g, " ").match(/(\d+(?:[.,]\d+)?)\s*(k|к|тыс|ming|миллион|million|млн|mln)?/i);
  if (digitMatch) {
    let num = parseFloat(digitMatch[1].replace(",", "."));
    const unit = digitMatch[2]?.toLowerCase();
    if (unit) {
      if (["k", "к", "тыс", "ming"].includes(unit)) num *= 1000;
      if (["миллион", "million", "млн", "mln"].includes(unit)) num *= 1000000;
    }
    return Math.round(num);
  }

  // 2. So'zlar bilan yozilgan sonlar
  const tokens = clean.split(/[\s,]+/);
  let total = 0;
  let currentGroup = 0; // 1000 dan kichik qism

  for (const t of tokens) {
    if (NUMBER_WORDS[t] !== undefined) {
      currentGroup += NUMBER_WORDS[t];
    } else if (t === "yuz") {
      currentGroup = (currentGroup || 1) * 100;
    } else if (["ming", "тысяча", "тысячи", "тысяч", "k", "к", "тыс"].includes(t)) {
      total += (currentGroup || 1) * 1000;
      currentGroup = 0;
    } else if (["million", "миллион", "миллиона", "миллионов", "млн"].includes(t)) {
      total += (currentGroup || 1) * 1000000;
      currentGroup = 0;
    }
  }
  total += currentGroup;
  return total > 0 ? total : null;
}
