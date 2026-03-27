require('dotenv').config(); // Instale com: npm install dotenv
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Obrigatório para o Neon.tech
  },
});

/**
 * Inicialização do Banco de Dados
 * Cria as tabelas necessárias caso não existam.
 */
const initDb = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log("🚀 Conectado ao Neon.tech com sucesso!");

    // 1. Tabela de Usuários (necessária para Auth e Roles)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user', -- 'admin' ou 'user'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabela de Configurações (usada no componente Settings)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        carry_balance BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabela de Transações (atualizada com user_id)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'despesa', -- 'receita', 'despesa', 'investimento'
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Tabelas verificadas/criadas com sucesso.");
  } catch (err) {
    console.error("❌ Erro na inicialização do DB:", err.message);
  } finally {
    if (client) client.release();
  }
};

// Executa a inicialização
initDb();

module.exports = {
  // Helper para queries simples
  query: (text, params) => pool.query(text, params),
  // Exporta o pool caso precise de funções mais complexas (como transações)
  pool,
};
