import express from "express";
import pg from "pg";

const connectionData = {
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
};

const db = new pg.Pool(connectionData);

const app = express();

app.use(express.json());

// Categories
app.get("/categories", async (req, res) => {
  try {
    const categories = await db.query("SELECT * FROM categories;");
    res.send(categories.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/categories", async (req, res) => {
  const name = req.body.name;

  if (name === "") {
    res.sendStatus(400);
    return;
  }

  try {
    const categories = await db.query("SELECT * FROM categories;");

    if (categories.rows.find((c) => c.name === name)) {
      res.sendStatus(409);
    } else {
      await db.query("INSERT INTO categories (name) VALUES ($1)", [name]);
      res.sendStatus(201);
    }
  } catch {
    res.sendStatus(500);
  }
});

// Games
app.get("/games", async (req, res) => {
  try {
    const games = await db.query("SELECT * FROM games;");
    res.send(games.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.listen(4000);
