const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;


// 🔹 LISTAR
app.get("/transactions", (req, res) => {
  db.all("SELECT * FROM transactions ORDER BY date DESC", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});


// 🔹 CRIAR
app.post("/transactions", (req, res) => {
  const { description, amount, category, type, date, notes } = req.body;

  db.run(
    `INSERT INTO transactions (description, amount, category, type, date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [description, amount, category, type, date, notes],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID });
    }
  );
});


// 🔹 ATUALIZAR
app.put("/transactions/:id", (req, res) => {
  const { id } = req.params;
  const { description, amount, category, type, date, notes } = req.body;

  db.run(
    `UPDATE transactions SET description=?, amount=?, category=?, type=?, date=?, notes=? WHERE id=?`,
    [description, amount, category, type, date, notes, id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ updated: this.changes });
    }
  );
});


// 🔹 DELETE
app.delete("/transactions/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM transactions WHERE id=?`, id, function (err) {
    if (err) return res.status(500).json(err);
    res.json({ deleted: this.changes });
  });
});

app.listen(PORT, () => {
  console.log("🚀 Backend rodando em http://localhost:3000");
});