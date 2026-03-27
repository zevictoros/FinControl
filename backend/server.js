const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Rota de Check-in (Health Check)
app.get("/", (req, res) => {
  res.send("🚀 API FinControl rodando com sucesso no Neon.tech");
});

// --- TRANSAÇÕES ---

// 🔹 LISTAR
app.get("/transactions", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM transactions ORDER BY date DESC, id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao buscar transações:", err.message);
    res.status(500).json({ error: "Erro ao buscar transações" });
  }
});

// 🔹 CRIAR
app.post("/transactions", async (req, res) => {
  try {
    const { description, amount, category, type, date, notes } = req.body;
    const query = `
      INSERT INTO transactions (description, amount, category, type, date, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [description, amount, category, type, date, notes];
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao criar transação:", err.message);
    res.status(500).json({ error: "Erro ao criar transação" });
  }
});

// 🔹 ATUALIZAR
app.put("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category, type, date, notes } = req.body;
    const query = `
      UPDATE transactions
      SET description=$1, amount=$2, category=$3, type=$4, date=$5, notes=$6
      WHERE id=$7
      RETURNING *
    `;
    const result = await db.query(query, [
      description,
      amount,
      category,
      type,
      date,
      notes,
      id,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Não encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao atualizar transação:", err.message);
    res.status(500).json({ error: "Erro ao atualizar" });
  }
});

// 🔹 DELETE
app.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM transactions WHERE id=$1", [id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error("❌ Erro ao deletar transação:", err.message);
    res.status(500).json({ error: "Erro ao deletar" });
  }
});

// --- CRYPTO HOLDINGS (Nova seção para sua aba Crypto) ---

// 🔹 LISTAR MOEDAS
app.get("/crypto-holdings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM crypto_holdings ORDER BY symbol ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao buscar crypto:", err.message);
    res.status(500).json({ error: "Erro ao buscar cripto" });
  }
});

// 🔹 SALVAR/ATUALIZAR MOEDA (UPSERT)
app.post("/crypto-holdings", async (req, res) => {
  try {
    const { symbol, amount } = req.body;
    const query = `
      INSERT INTO crypto_holdings (symbol, amount)
      VALUES ($1, $2)
      ON CONFLICT (symbol) 
      DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(query, [symbol.toUpperCase(), amount]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao salvar crypto:", err.message);
    res.status(500).json({ error: "Erro ao salvar cripto" });
  }
});

// 🔹 DELETAR MOEDA
app.delete("/crypto-holdings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM crypto_holdings WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao deletar crypto:", err.message);
    res.status(500).json({ error: "Erro ao deletar cripto" });
  }
});

// --- CONFIGURAÇÕES ---

app.get("/settings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT carry_balance FROM user_settings LIMIT 1",
    );
    const settings =
      result.rows.length > 0 ? result.rows[0] : { carry_balance: false };
    res.json(settings);
  } catch (err) {
    console.error("❌ Erro ao buscar settings:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/settings", async (req, res) => {
  try {
    const { carry_balance } = req.body;
    const query = `
      INSERT INTO user_settings (user_id, carry_balance)
      VALUES (1, $1)
      ON CONFLICT (user_id) 
      DO UPDATE SET carry_balance = EXCLUDED.carry_balance
    `;
    await db.query(query, [carry_balance]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao salvar settings:", err.message);
    res.status(500).json({ error: "Erro ao salvar configurações" });
  }
});

// --- USUÁRIOS ---

app.get("/users", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, role FROM users ORDER BY name ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao buscar usuários:", err.message);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.post("/users/invite", async (req, res) => {
  try {
    const { email, role, name } = req.body;
    await db.query(
      "INSERT INTO users (name, email, role, password) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
      [name || "Convidado", email, role, "123456"],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao convidar usuário:", err.message);
    res.status(500).json({ error: "Erro ao convidar usuário" });
  }
});

// Captura de rotas inexistentes (Para evitar o 404 sem explicação)
app.use((req, res) => {
  res
    .status(404)
    .json({ error: `Rota ${req.originalUrl} não encontrada no servidor.` });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend FinControl rodando na porta ${PORT}`);
});
