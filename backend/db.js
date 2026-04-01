require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Obrigatório para Neon.tech
  },
});

const initDb = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log("🚀 Conectado ao Neon.tech com sucesso!");

    // 1. Usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Configurações
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        carry_balance BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Categorias (NOVA TABELA)
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER DEFAULT 1, -- Ajustar quando tiver Auth real
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL, -- 'despesa' ou 'receita'
        is_deleted BOOLEAN DEFAULT FALSE,
        UNIQUE(user_id, name, type)
      );
    `);

    // 4. Transações
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'despesa',
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Crypto Holdings
    await client.query(`
      CREATE TABLE IF NOT EXISTS crypto_holdings (
        id SERIAL PRIMARY KEY,
        symbol TEXT UNIQUE NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Banco de dados sincronizado.");
  } catch (err) {
    console.error("❌ Erro na inicialização do DB:", err.message);
  } finally {
    if (client) client.release();
  }
};

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
