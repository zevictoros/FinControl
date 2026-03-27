const express = require("express");
const cors = require("cors");
const db = require("./db"); // Importa o pool do novo db.js que te mandei

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🚀 API FinControl rodando com sucesso no Neon.tech");
});

// 🔹 LISTAR
app.get("/transactions", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM transactions ORDER BY date DESC",
    );
    res.json(result.rows); // O Postgres retorna os dados dentro da propriedade .rows
  } catch (err) {
    console.error(err);
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
      RETURNING id
    `;
    const values = [description, amount, category, type, date, notes];

    const result = await db.query(query, values);
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
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
    `;
    const values = [description, amount, category, type, date, notes, id];

    const result = await db.query(query, values);
    res.json({ updated: result.rowCount }); // rowCount indica quantas linhas foram alteradas
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar transação" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
