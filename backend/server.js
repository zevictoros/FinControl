const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ IMPORTANTE para Render
const PORT = process.env.PORT || 3000;

// 🔹 LISTAR
app.get("/transactions", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM transactions ORDER BY date DESC")
      .all();

    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 🔹 CRIAR
app.post("/transactions", (req, res) => {
  try {
    const { description, amount, category, type, date, notes } = req.body;

    const result = db
      .prepare(
        `
        INSERT INTO transactions (description, amount, category, type, date, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(description, amount, category, type, date, notes);

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 🔹 ATUALIZAR
app.put("/transactions/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category, type, date, notes } = req.body;

    const result = db
      .prepare(
        `
        UPDATE transactions
        SET description=?, amount=?, category=?, type=?, date=?, notes=?
        WHERE id=?
      `,
      )
      .run(description, amount, category, type, date, notes, id);

    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 🔹 DELETE
app.delete("/transactions/:id", (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare(`DELETE FROM transactions WHERE id=?`).run(id);

    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 🔥 START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
