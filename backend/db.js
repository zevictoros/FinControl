const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Obrigatório para o Neon
  },
});

// Teste de conexão inicial e criação de tabela
const initDb = async () => {
  try {
    const client = await pool.connect();
    console.log("🚀 Conectado ao Neon.tech com sucesso!");

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT,
        type TEXT DEFAULT 'despesa',
        date DATE NOT NULL,
        notes TEXT
      );
    `);
    client.release();
  } catch (err) {
    console.error("❌ Erro ao conectar ou criar tabela:", err);
  }
};

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
