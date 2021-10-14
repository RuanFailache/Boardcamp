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
app.get("/categories", (req, res) => {
  db.query("SELECT * FROM categories;")
    .then((categories) => res.send(categories.rows))
    .catch(() => res.sendStatus(500));
});

app.post("/categories", (req, res) => {
  const name = req.body.name;

  if (name === "") {
    res.sendStatus(400);
    return;
  }

  db.query("SELECT * FROM categories;")
    .then((result) => {
      if (result.rows.find((c) => c.name === name)) {
        res.sendStatus(409);
      } else {
        db.query("INSERT INTO categories (name) VALUES ($1)", [name])
          .then(() => res.sendStatus(201))
          .catch(() => res.sendStatus(500));
      }
    })
    .catch(() => res.sendStatus(500));
});

// Games
app.get("/games", (req, res) => {
  db.query("SELECT * FROM games;")
    .then((games) => res.send(games.rows))
    .catch(() => res.sendStatus(500));
});

app.listen(4000);
