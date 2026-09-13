# RentBot MVP — Kichik biznes va savdo uchun moliya yordamchisi

Telegram Mini App + Telegram Bot:
- Birgina bosish orqali daromad va xarajatlarni qayd etadi (matn yoki ovozli xabar orqali);
- Ijara, oylik va boshqa muntazam to'lovlarni o'z vaqtida eslatadi;
- Biznesni zararga kiritmagan holda yangi maqsadlar (masalan, yangi muzlatgich, do'kon jihozi) uchun reja asosida pul jamg'arishni hisoblaydi;
- Oylik moliyaviy hisobotlarni oddiy va tushunarli tilda ko'rsatadi (PDF va Excel eksporti bilan);
- **Yangi sozlamalar:** O'zbekcha va Ruscha interfeys, So'm va Rubl valyutalari, Yorug' va Qorong'i mavzu;
- Boshida 7 kun bepul sinov muddati (trial), so'ngra 200 000 so'm/oy.

---

## Loyiha tuzilishi

```text
rentbot-mvp/
├── backend/    Express + SQLite API (barcha moliyaviy mantiq, hisob-kitoblar va ma'lumotlar bazasi)
├── bot/        Telegraf asosidagi Telegram-bot (buyruqlar, sozlamalar, jadvalli eslatmalar, ovozli xabarlar)
└── miniapp/    React (Vite) Mini App — Telegram ichidagi zamonaviy vizual interfeys
```

---

## Botdagi yangi sozlamalar (Settings)

Botga qulay interaktiv sozlamalar tizimi qo'shildi. Sozlamalar menyusini ochish uchun quyidagi buyruqlardan birini yuborish kifoya:
- `/settings` yoki `/sozlamalar` (ruscha: `/настройки`)

Menyu orqali quyidagilarni o'zgartirish mumkin:
1. **🌐 Til tanlash (Til / Язык):**
   - 🇷🇺 Русский
   - 🇺🇿 O'zbekcha
2. **💵 Asosiy hisob valyutasi (Valyuta):**
   - 🇺🇿 So'm (UZS)
   - 🇷🇺 Rubl (₽)
3. **🎨 Ilova ko'rinishi (Mavzu / Тема):**
   - ☀️ Yorug' (Светлая)
   - 🌙 Qorong'i (Тёмная)

### Tezkor buyruqlar:
- `/start` — Botni ishga tushirish va ro'yxatdan o'tish
- `/sozlamalar` (yoki `/settings`) — Sozlamalar menyusi (til, valyuta, mavzu)
- `/daromad 100000` (yoki `/доход 100000`) — Daromadni tezkor kiritish
- `/xarajat 50000` (yoki `/расход 50000`) — Xarajatni tezkor kiritish
- `/hisobot` (yoki `/отчет`) — Joriy oy uchun tezkor moliyaviy hisobot
- `/app` — Mini App-ni ochish havolasi

---

## Mahalliy muhitda ishga tushirish (Local Setup)

### 0-qadam. BotFather orqali bot yaratish va tokenni olish

1. Telegram-da **@BotFather** botini oching.
2. Yangi bot ochish uchun `/newbot` buyrug'ini yuboring (yoki mavjud bot uchun `/mybots` → botingizni tanlang → `API Token`).
3. BotFather bergan API tokenni nusxalab oling (ko'rinishi: `8509050334:AAHY...`).

> [!CAUTION]
> **Xavfsizlik qoidasi:** Bot tokeni xuddi parolga o'xshaydi. Uni ochiq GitHub repozitoriylariga, chatlarga yoki skrinshotlarga qo'ymang! Faqat `.env` faylida saqlang. Agar token oshkor bo'lib qolsa, Telegram uni avtomatik bloklaydi — bunday holatda BotFather orqali `Revoke token` qilib, yangisini oling.

---

### 1-qadam. Backend (Server)

```bash
cd backend
npm install
npm run dev
```
- Server `http://localhost:3001` manzilida ishga tushadi.
- SQLite ma'lumotlar bazasi fayli (`data.sqlite`) birinchi ishga tushganda avtomatik ravishda yaratiladi va barcha jadvallar o'rnatiladi.

---

### 2-qadam. Telegram Bot

```bash
cd bot
cp .env.example .env
```

`bot/.env` faylini oching va quyidagi o'zgaruvchilarni to'ldiring:
```env
BOT_TOKEN=botfatherdan_olingan_token
BACKEND_URL=http://localhost:3001
MINIAPP_URL=https://sizning-miniapp-manzilingiz.vercel.app/

# Ixtiyoriy: ovozli xabarlarni tushunish uchun bepul Google Gemini kaliti:
GEMINI_API_KEY=
```

Keyin botni ishga tushiring:
```bash
npm install
npm run dev
```
Konsolda `RentBot bot muvaffaqiyatli ishga tushdi` yozuvi paydo bo'ladi. Telegram-da botingizga `/start` yozib ko'ring!

---

### 3-qadam. Mini App (Frontend)

```bash
cd miniapp
npm install
npm run dev
```
- `http://localhost:5173` manzilida ishga tushadi.
- Brauzerda ochib ko'rishingiz mumkin (foydalanuvchi ma'lumotlari ishlab chiqish rejimi uchun avtomatik to'ldiriladi).

---

## Serverga yuklash (Deploy bo'yicha to'liq qo'llanma)

Telegram Mini App **albatta HTTPS protokolida ishlashi shart**, aks holda Telegram ilova ichida uni ochmaydi.

Eng qulay va tezkor arxitektura:
- **Frontend (miniapp)** ➔ **Vercel** (bepul HTTPS, avtomatik tezkor CDN).
- **Backend va Bot** ➔ **Railway** (doimiy ishlaydigan Node.js konteynerlar va avtomatik HTTPS domen).

```text
[ Telegram Mini App (Vercel) ] ──(HTTPS)──> [ Backend API (Railway) ]
                                                   ▲
[ Telegram Bot (Railway) ] ────────────────────────┘
```

---

### 1. Backend-ni Railway-da ishga tushirish

1. [railway.com](https://railway.com) saytiga kiring va GitHub profilingiz orqali kiring.
2. `New Project` ➔ `Deploy from GitHub repo` ➔ o'zingizning `mvp` repozitoriyangizni tanlang.
3. Yangi yaratilgan servis ustiga bosing va **Settings** bo'limiga kiring:
   - Servis nomini `backend` deb o'zgartiring.
   - **Root Directory** bo'limiga **qat'iy ravishda `/backend`** deb yozing!
4. **Settings** sahifasini pastga aylantirib, **Networking (Public Networking)** bo'limidagi **Generate Domain** tugmasini bosing.
5. Railway sizga quyidagi ko'rinishdagi ochiq HTTPS manzil beradi:
   `https://backend-production-xxxx.up.railway.app`
6. Ushbu manzilni brauzerda tekshirib ko'ring: `https://...up.railway.app/health` — javob sifatida `{"ok": true}` chiqishi kerak!

---

### 2. Mini App-ni Vercel-da ishga tushirish

1. [vercel.com](https://vercel.com) saytiga kiring va GitHub orqali ro'yxatdan o'ting.
2. `Add New Project` ➔ o'zingizning `mvp` repozitoriyangizni tanlang.
3. Sozlamalarda:
   - **Root Directory:** `miniapp` papkasini tanlang.
   - **Environment Variables** bo'limiga quyidagini qo'shing:
     - **Key (Nomi):** `VITE_BACKEND_URL`
     - **Value (Qiymati):** `https://backend-production-xxxx.up.railway.app`
     > [!IMPORTANT]
     > Manzil oldida **`https://`** bo'lishi shart va oxirida ortiqcha slesh (`/`) bo'lmasligi kerak!
4. **Deploy** tugmasini bosing. 1 daqiqada sizga tayyor `https://sizning-loyihangiz.vercel.app` manzili beriladi.

> [!TIP]
> Agar kelgusida Vercel-da `VITE_BACKEND_URL` manzilini o'zgartirsangiz, o'zgarish kuchga kirishi uchun **Deployments** bo'limida oxirgi deploysti uchta nuqta (`...`) orqali **Redeploy** qilishingiz shart. Chunki Vite o'zgaruvchilarni faqat yig'ish (build) paytida kodga kiritadi.

---

### 3. Bot-ni Railway-da ishga tushirish

1. O'sha Railway loyihangizda ikkinchi servisni qo'shing: `+ New` ➔ `GitHub Repo` ➔ yana `mvp` repozitoriyasini tanlang.
2. Servisning **Settings** qismiga kiring:
   - Nomini `bot` deb qo'ying.
   - **Root Directory** qismiga:
     ```text
     /bot
     ```
3. Servisning **Variables** (Muhit o'zgaruvchilari) bo'limiga kiring va quyidagilarni kiriting:
   - `BOT_TOKEN` = BotFather'dan olingan toza tokeningiz;
   - `BACKEND_URL` = 1-bosqichdagi backend manzili (`https://backend-production-xxxx.up.railway.app`);
   - `MINIAPP_URL` = 2-bosqichdagi Vercel manzili (`https://sizning-loyihangiz.vercel.app`);
   - `GEMINI_API_KEY` = (ixtiyoriy) Ovozli xabarlar uchun Google AI Studio kaliti.
4. Railway botni ishga tushiradi va **Deploy Logs** qismida `RentBot bot muvaffaqiyatli ishga tushdi` degan yozuv chiqadi.

---

### 4. Telegram-da Menyuni ulash (BotFather)

Ilovani to'g'ridan-to'g'ri Telegram menyusidan ochiladigan qilish uchun:
1. **@BotFather** botiga `/mybots` deb yozing.
2. O'z botingizni tanlang ➔ **Bot Settings** ➔ **Menu Button** ➔ **Configure menu button**.
3. Vercel havolasini yuboring (`https://sizning-loyihangiz.vercel.app`).
4. Tugma nomini yuboring, masalan: `📊 Ochish` yoki `📊 Hisob-kitob`.
5. Tayyor! Endi foydalanuvchi botni ochganda chap pastki burchakda ushbu tugma doim ko'rinib turadi.

---

## Ovozli xabarlarni tushunish (Gemini AI integratsiyasi)

Sotuvchi bozor yoki do'konda band bo'lganida summani yozib o'tirmasdan, shunchaki ovozli xabar yuborishi mumkin:
- *«Bugun bir yuz ellik ming savdo qildim»* ➔ Bot daromadga 150 000 so'm qo'shadi.
- *«Tushlikka qirq ming ketdi»* ➔ Bot xarajatga 40 000 so'm qo'shadi.
- *«Заработал двести тысяч»* ➔ Bot daromadga 200 000 so'm qo'shadi.

### Gemini kalitini qanday olish mumkin?
1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) sahifasiga Google akkauntingiz orqali kiring.
2. **Create API key** tugmasini bosing (bu bepul, bank kartasi talab qilinmaydi).
3. Hosil bo'lgan kalitni nusxalab, Railway-dagi `bot` servisining `GEMINI_API_KEY` o'zgaruvchisiga qo'ying.

---

## Eslatmalar va avtomatlashtirilgan xabarlar

Bot har kuni quyidagi vaqtlarda server orqali foydalanuvchiga foydali eslatmalar yuboradi:
- **09:00** — Bugungi muntazam to'lovlar (ijara, kommunal xizmatlar va h.k.);
- **10:00** — Qaytish muddati o'tib ketgan qarzlar haqida eslatma (kim qancha qaytarishi kerakligi bilan);
- **20:00** — Agar foydalanuvchi kun davomida birorta ham daromad yoki xarajat yozmagan bo'lsa, xushmuomala eslatma.

Barcha eslatmalar foydalanuvchi tanlagan tilda (o'zbekcha yoki ruscha) va tanlangan valyutada (so'm yoki rubl) yuboriladi.

---

## To'lov tizimlari (Payme va Click integratsiyasi)

Hozirgi MVP versiyada `backend/src/routes/users.js` faylidagi `POST /api/users/:id/subscribe` yo'li 30 kunga sinov obunasini darhol uzaytiruvchi namuna sifatida sozlangan.

Haqiqiy biznes uchun Payme yoki Click-ni ulash tartibi:
1. [Payme for Business](https://developer.help.paycom.uz/) yoki [Click Merchant](https://docs.click.uz/) tizimida ro'yxatdan o'tasiz.
2. Ular sizning backend manzilingizga to'lov amalga oshgani haqida Webhook (bildirishnoma) yuboradi.
3. Webhook muvaffaqiyatli kelganda foydalanuvchining `subscribed_until` sanasini ma'lumotlar bazasida yangilaysiz.

---

## Texnologiyalar to'plami (Tech Stack)

- **Backend:** Node.js, Express, Better-SQLite3 (WAL rejimi bilan tezkor ishlash), PDFKit, XLSX.
- **Bot:** Telegraf (Telegram Bot API framework), Node-Cron, Axios, Google Gemini 1.5 Flash.
- **Frontend (Mini App):** React 18, Vite, React Router, Axios, CSS Variables (Telegram xavfsiz dizayn tizimi).
