const express = require("express");
const cors    = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path    = require("path");

const app = express();
const PORT = 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Database ───────────────────────────────────────────────
// Use __dirname so tasks.db always lives next to server.js
// regardless of which directory you run node from
const db = new sqlite3.Database(
  path.join(__dirname, "tasks.db"),
  (err) => {
    if (err) console.error("DB connection error:", err.message);
    else     console.log("Connected to SQLite");
  }
);

db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL,
    done  INTEGER NOT NULL DEFAULT 0
  )
`);

// ── Routes ─────────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({ message: "server running", status: "db up" });
});

// GET all tasks
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET single task
app.get("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Task not found" });
    res.json(row);
  });
});

// POST create task
// Body: { "title": "Buy milk" }
app.post("/tasks", (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  // NOTE: table name is lowercase "tasks" — must match CREATE TABLE above
  db.run(
    "INSERT INTO tasks (title) VALUES (?)",
    [title.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, title: title.trim(), done: 0 });
    }
  );
});

// PUT toggle done (or full update)
// Body: { "done": 1 }  OR  { "title": "new name", "done": 0 }
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;

  // First fetch existing row so we can apply partial updates
  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Task not found" });

    const title = req.body.title !== undefined ? req.body.title.trim() : row.title;
    const done  = req.body.done  !== undefined ? req.body.done          : row.done;

    db.run(
      "UPDATE tasks SET title = ?, done = ? WHERE id = ?",
      [title, done, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: Number(id), title, done });
      }
    );
  });
});

// DELETE task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err)            return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Task not found" });
    res.json({ deleted: true, id: Number(id) });
  });
});

// DELETE all completed tasks
app.delete("/tasks/done/all", (req, res) => {
  db.run("DELETE FROM tasks WHERE done = 1", [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});