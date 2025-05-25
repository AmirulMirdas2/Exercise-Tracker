const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Penyimpanan data sementara
let users = [];
let exercises = {};

// Generate ID sederhana
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// POST /api/users → Buat user baru
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const newUser = {
    username,
    _id: generateId(),
  };
  users.push(newUser);
  exercises[newUser._id] = [];
  res.json(newUser);
});

// GET /api/users → Ambil semua user
app.get("/api/users", (req, res) => {
  res.json(users);
});

// POST /api/users/:_id/exercises → Tambah latihan
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = users.find((u) => u._id === userId);
  if (!user) return res.status(400).json({ error: "User not found" });

  const exerciseDate = date ? new Date(date) : new Date();

  const exercise = {
    description,
    duration: parseInt(duration),
    date: exerciseDate, // Simpan sebagai Date object
  };

  exercises[userId].push(exercise);

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(), // Format saat response
    _id: user._id,
  });
});

// GET /api/users/:_id/logs → Ambil log latihan user
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const user = users.find((u) => u._id === userId);
  if (!user) return res.status(400).json({ error: "User not found" });

  let log = exercises[userId] || [];

  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    log = log.filter((ex) => new Date(ex.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter((ex) => new Date(ex.date) <= toDate);
  }

  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  // Pastikan setiap date dalam log adalah string dengan format .toDateString()
  const cleanLog = log.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date: new Date(ex.date).toDateString(),
  }));

  res.json({
    username: user.username,
    count: cleanLog.length,
    _id: user._id,
    log: cleanLog,
  });
});

// Start server
const listener = app.listen(process.env.PORT || 3003, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
// Export app for testing
