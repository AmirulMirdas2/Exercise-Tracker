const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Data penyimpanan sementara
let users = [];
let exercises = {};

// POST /api/users → buat user baru
app.post("/api/users", express.urlencoded({ extended: false }), (req, res) => {
  const username = req.body.username;
  const newUser = {
    username,
    _id: generateId(),
  };
  users.push(newUser);
  exercises[newUser._id] = [];
  res.json(newUser);
});

// GET /api/users → ambil semua user
app.get("/api/users", (req, res) => {
  res.json(users);
});

// POST /api/users/:_id/exercises → tambah latihan
app.post(
  "/api/users/:_id/exercises",
  express.urlencoded({ extended: false }),
  (req, res) => {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    const user = users.find((u) => u._id === userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    const exerciseDate = date ? new Date(date) : new Date();
    const exercise = {
      description,
      duration: parseInt(duration),
      date: exerciseDate.toDateString(), // Pastikan ini string dengan format toDateString()
    };

    exercises[userId].push(exercise);

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
      _id: user._id,
    });
  }
);

// GET /api/users/:_id/logs → ambil log latihan user
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const user = users.find((u) => u._id === userId);
  if (!user) return res.status(400).json({ error: "User not found" });

  let log = exercises[userId] || [];

  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    log = log.filter((ex) => {
      const exerciseDate = new Date(ex.date);
      return exerciseDate >= fromDate;
    });
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter((ex) => {
      const exerciseDate = new Date(ex.date);
      return exerciseDate <= toDate;
    });
  }

  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  // PENTING: Pastikan setiap object di log array memiliki date sebagai string dengan format toDateString()
  const cleanLog = log.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date:
      typeof ex.date === "string" ? ex.date : new Date(ex.date).toDateString(),
  }));

  res.json({
    username: user.username,
    count: cleanLog.length,
    _id: user._id,
    log: cleanLog,
  });
});

// Function buat generate ID random
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const listener = app.listen(process.env.PORT || 3003, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
