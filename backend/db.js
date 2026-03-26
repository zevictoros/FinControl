const Database = require("better-sqlite3");

const db = new Database("database.sqlite");

// criar tabela
db.prepare(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    type TEXT DEFAULT 'despesa',
    date TEXT NOT NULL,
    notes TEXT
  )
`).run();

module.exports = db;