import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "..", "data.sqlite"));

db.pragma("journal_mode = WAL");

// ---- Schema -----------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  telegram_id       INTEGER PRIMARY KEY,
  first_name        TEXT,
  username          TEXT,
  created_at        TEXT DEFAULT (datetime('now')),
  trial_ends_at     TEXT,          -- ISO date, 7 days from created_at
  subscribed_until  TEXT           -- ISO date, null if not paid
);

CREATE TABLE IF NOT EXISTS transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id   INTEGER NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount        INTEGER NOT NULL,      -- сум, целое число
  category      TEXT,                  -- напр. 'аренда', 'товар', 'зарплата'
  note          TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

-- is_active = 1: цель ещё копится
-- is_active = 0 + status='purchased': куплена
-- is_active = 0 + status='cancelled': отменена пользователем, не завершая
CREATE TABLE IF NOT EXISTS goals (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id       INTEGER NOT NULL,
  title             TEXT NOT NULL,     -- 'Холодильник побольше'
  target_amount     INTEGER NOT NULL,
  saved_amount      INTEGER DEFAULT 0,
  is_active         INTEGER DEFAULT 1,
  status            TEXT DEFAULT 'active', -- active | purchased | cancelled
  created_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS reminders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id   INTEGER NOT NULL,
  title         TEXT NOT NULL,        -- 'Аренда'
  amount        INTEGER,
  day_of_month  INTEGER NOT NULL,     -- 1-28, день напоминания
  is_active     INTEGER DEFAULT 1,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

-- Люди, которым продавец дал в долг
CREATE TABLE IF NOT EXISTS debtors (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id   INTEGER NOT NULL,
  name          TEXT NOT NULL,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

-- Записи по долгу: 'lent' — дали в долг (+), 'repaid' — вернули (-)
CREATE TABLE IF NOT EXISTS debt_entries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  debtor_id     INTEGER NOT NULL,
  telegram_id   INTEGER NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('lent','repaid')),
  amount        INTEGER NOT NULL,
  note          TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (debtor_id) REFERENCES debtors(id)
);
`);

// ---- Мягкие миграции для баз, созданных до этого обновления -----------
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
ensureColumn("goals", "status", "TEXT DEFAULT 'active'");

export default db;
