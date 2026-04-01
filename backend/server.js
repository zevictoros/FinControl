const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🚀 API FinControl rodando com sucesso no Neon.tech");
});

// --- CATEGORIAS ---

app.get("/categories", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories WHERE user_id = 1");
    res.json(result.rows || []);
  } catch (err) {
    console.error("Erro GET /categories:", err.message);
    res.status(500).json({ error: "Erro ao buscar categorias." });
  }
});

app.post("/categories", async (req, res) => {
  try {
    const { name, label, color, type, is_deleted } = req.body;
    const query = `
      INSERT INTO categories (user_id, name, label, color, type, is_deleted)
      VALUES (1, $1, $2, $3, $4, $5)
      ON CONFLICT (user_id, name, type) 
      DO UPDATE SET label = EXCLUDED.label, color = EXCLUDED.color, is_deleted = EXCLUDED.is_deleted
      RETURNING *
    `;
    const result = await db.query(query, [
      name,
      label || name,
      color || "#64748b",
      type,
      !!is_deleted,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro POST /categories:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/categories/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM categories WHERE id = $1 AND user_id = 1", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover categoria." });
  }
});

// --- TRANSAÇÕES ---

app.get("/transactions", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM transactions ORDER BY date DESC, id DESC",
    );
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar transações." });
  }
});

app.post("/transactions", async (req, res) => {
  try {
    const { description, amount, category, type, date, notes } = req.body;
    const query = `
      INSERT INTO transactions (user_id, description, amount, category, type, date, notes)
      VALUES (1, $1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const result = await db.query(query, [
      description || "Sem descrição",
      parseFloat(amount) || 0,
      category || "Outros",
      type || "despesa",
      date || new Date().toISOString().split("T")[0],
      notes || "",
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro POST /transactions:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/transactions/:id", async (req, res) => {
  try {
    const { description, amount, category, type, date, notes } = req.body;
    const query = `
      UPDATE transactions
      SET description=$1, amount=$2, category=$3, type=$4, date=$5, notes=$6
      WHERE id=$7 RETURNING *
    `;
    await db.query(query, [
      description,
      parseFloat(amount),
      category,
      type,
      date,
      notes,
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar transação." });
  }
});

app.delete("/transactions/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM transactions WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar transação." });
  }
});

// --- CRYPTO HOLDINGS (AGORA COM EDITAR) ---

app.get("/crypto-holdings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM crypto_holdings ORDER BY symbol ASC",
    );
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar crypto." });
  }
});

app.post("/crypto-holdings", async (req, res) => {
  try {
    const { symbol, amount } = req.body;
    const result = await db.query(
      "INSERT INTO crypto_holdings (symbol, amount) VALUES ($1, $2) ON CONFLICT (symbol) DO UPDATE SET amount = EXCLUDED.amount RETURNING *",
      [symbol.toUpperCase(), parseFloat(amount)],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota de EDIÇÃO de Cripto
app.put("/crypto-holdings/:id", async (req, res) => {
  try {
    const { symbol, amount } = req.body;
    const { id } = req.params;
    const result = await db.query(
      "UPDATE crypto_holdings SET symbol = $1, amount = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [symbol.toUpperCase(), parseFloat(amount), id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro PUT crypto:", err.message);
    res.status(500).json({ error: "Erro ao atualizar moeda." });
  }
});

app.delete("/crypto-holdings/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM crypto_holdings WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar moeda." });
  }
});

// --- SETTINGS ---

app.get("/settings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT carry_balance FROM user_settings WHERE user_id = 1",
    );
    res.json(result.rows[0] || { carry_balance: false });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar settings." });
  }
});

app.post("/settings", async (req, res) => {
  try {
    const { carry_balance } = req.body;
    await db.query(
      "INSERT INTO user_settings (user_id, carry_balance) VALUES (1, $1) ON CONFLICT (user_id) DO UPDATE SET carry_balance = EXCLUDED.carry_balance",
      [!!carry_balance],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao salvar settings." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend FinControl rodando na porta ${PORT}`);
});
