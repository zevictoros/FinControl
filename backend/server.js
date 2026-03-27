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
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Erro ao buscar transações:", err.message);
    res.status(500).json({ error: "Erro ao buscar transações no banco." });
  }
});

// 🔹 CRIAR
app.post("/transactions", async (req, res) => {
  try {
    const { description, amount, category, type, date, notes } = req.body;

    // Garantia de tipos: amount precisa ser número
    const cleanAmount = parseFloat(amount) || 0;
    const cleanDate = date || new Date().toISOString().split("T")[0];

    const query = `
      INSERT INTO transactions (description, amount, category, type, date, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      description || "Sem descrição",
      cleanAmount,
      category || "Outros",
      type || "despesa",
      cleanDate,
      notes || "",
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao criar transação:", err.message);
    res.status(500).json({ error: "Falha ao salvar transação." });
  }
});

// 🔹 ATUALIZAR
app.put("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category, type, date, notes } = req.body;

    const cleanAmount = parseFloat(amount) || 0;

    const query = `
      UPDATE transactions
      SET description=$1, amount=$2, category=$3, type=$4, date=$5, notes=$6
      WHERE id=$7
      RETURNING *
    `;
    const result = await db.query(query, [
      description,
      cleanAmount,
      category,
      type,
      date,
      notes,
      id,
    ]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Transação não encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao atualizar transação:", err.message);
    res.status(500).json({ error: "Falha ao atualizar dados." });
  }
});

// 🔹 DELETE
app.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM transactions WHERE id=$1", [id]);
    res.json({ success: true, deleted: result.rowCount });
  } catch (err) {
    console.error("❌ Erro ao deletar transação:", err.message);
    res.status(500).json({ error: "Erro ao remover transação." });
  }
});

// --- CRYPTO HOLDINGS ---

// 🔹 LISTAR
app.get("/crypto-holdings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM crypto_holdings ORDER BY symbol ASC",
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Erro ao buscar crypto:", err.message);
    res.status(500).json({ error: "Erro ao buscar carteira de criptos." });
  }
});

// 🔹 SALVAR/ATUALIZAR (UPSERT) - CORRIGIDO PARA ERRO 500
app.post("/crypto-holdings", async (req, res) => {
  try {
    const { symbol, amount } = req.body;

    // Tratamento rigoroso: símbolo sempre maiúsculo e amount como número preciso
    const cleanSymbol = String(symbol).toUpperCase().trim();
    const cleanAmount = parseFloat(amount) || 0;

    const query = `
      INSERT INTO crypto_holdings (symbol, amount)
      VALUES ($1, $2)
      ON CONFLICT (symbol) 
      DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(query, [cleanSymbol, cleanAmount]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro no POST Crypto:", err.message);
    // Retorna a mensagem real do banco para ajudar no debug
    res.status(500).json({ error: err.message });
  }
});

// 🔹 DELETAR
app.delete("/crypto-holdings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM crypto_holdings WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao deletar crypto:", err.message);
    res.status(500).json({ error: "Erro ao remover moeda." });
  }
});

// --- CONFIGURAÇÕES ---

app.get("/settings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT carry_balance FROM user_settings LIMIT 1",
    );
    // Se não houver config, retorna o padrão falso em vez de erro
    res.json(result.rows[0] || { carry_balance: false });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar configurações." });
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
    await db.query(query, [!!carry_balance]); // Garante booleano
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao salvar configurações." });
  }
});

// --- USUÁRIOS ---

app.get("/users", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, role FROM users ORDER BY name ASC",
    );
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar usuários." });
  }
});

app.post("/users/invite", async (req, res) => {
  try {
    const { email, role, name } = req.body;
    if (!email) return res.status(400).json({ error: "Email é obrigatório" });

    await db.query(
      "INSERT INTO users (name, email, role, password) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
      [name || "Convidado", email, role || "user", "123456"],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao convidar usuário." });
  }
});

// Captura de rotas inexistentes
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.originalUrl} não encontrada.` });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend FinControl rodando na porta ${PORT}`);
});
