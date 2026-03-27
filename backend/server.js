const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Rota de Check-in
app.get("/", (req, res) => {
  res.send("🚀 API FinControl rodando com sucesso no Neon.tech");
});

// --- TRANSAÇÕES ---

// 🔹 LISTAR
app.get("/transactions", async (req, res) => {
  try {
    // Busca todas as transações (no futuro, você filtrará por user_id aqui)
    const result = await db.query(
      "SELECT * FROM transactions ORDER BY date DESC, id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar:", err);
    res.status(500).json({ error: "Erro ao buscar transações" });
  }
});

// 🔹 CRIAR
app.post("/transactions", async (req, res) => {
  try {
    const { description, amount, category, type, date, notes } = req.body;

    // O RETURNING * nos permite devolver o objeto completo criado para o Frontend
    const query = `
      INSERT INTO transactions (description, amount, category, type, date, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [description, amount, category, type, date, notes];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar:", err);
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
    const values = [description, amount, category, type, date, notes, id];

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar:", err);
    res.status(500).json({ error: "Erro ao atualizar transação" });
  }
});

// 🔹 DELETE
app.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM transactions WHERE id=$1", [id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error("Erro ao deletar:", err);
    res.status(500).json({ error: "Erro ao deletar transação" });
  }
});

// --- CONFIGURAÇÕES (Necessário para a tela Settings e Dashboard) ---

// 🔹 BUSCAR CONFIGS
app.get("/settings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT carry_balance FROM user_settings LIMIT 1",
    );
    // Se result.rows estiver vazio, retornamos um padrão em vez de undefined
    const settings =
      result.rows.length > 0 ? result.rows[0] : { carry_balance: false };
    res.json(settings);
  } catch (err) {
    console.error("Erro detalhado no banco:", err.message); // Isso vai te mostrar o erro real no console
    res.status(500).json({ error: err.message });
  }
});

// 🔹 SALVAR/ATUALIZAR CONFIGS (UPSERT)
app.post("/settings", async (req, res) => {
  try {
    const { carry_balance } = req.body;
    // Simulando user_id 1 até ter o Auth pronto
    const query = `
      INSERT INTO user_settings (user_id, carry_balance)
      VALUES (1, $1)
      ON CONFLICT (user_id) 
      DO UPDATE SET carry_balance = EXCLUDED.carry_balance
    `;
    await db.query(query, [carry_balance]);
    res.json({ success: true });
  } catch (err) {
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
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.post("/users/invite", async (req, res) => {
  try {
    const { email, role, name } = req.body;
    await db.query(
      "INSERT INTO users (name, email, role, password) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
      [name || "Convidado", email, role, "123456"], // Senha padrão temporária
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao convidar usuário" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
