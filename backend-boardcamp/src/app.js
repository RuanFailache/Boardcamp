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
      await db.query(
        "INSERT INTO categories (name) VALUES ($1)",
        [name]
      );
      res.sendStatus(201);
    }
  } catch {
    res.sendStatus(500);
  }
});

// Games
app.get("/games", async (req, res) => {
  const name = req.query.name;

  try {
    const games = await db.query(
      `SELECT
        games.id AS id,
        games.name AS name,
        games."stockTotal" AS "stockTotal",
        games."categoryId" AS "categoryId",
        games."pricePerDay" AS "pricePerDay",
        categories.name AS "categoryName"
      FROM games
        JOIN categories
          ON games."categoryId" = categories.id
      WHERE games.name ILIKE $1;`, [name + '%']
    );
    res.send(games.rows);
  } catch (err) {
    console.log(err)
    res.sendStatus(500);
  }
});

app.post("/games", async (req, res) => {
  const {
    name,
    image,
    stockTotal,
    categoryId,
    pricePerDay
  } = req.body;

  try {
    await db.query(
      'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay")\
        VALUES ($1, $2, $3, $4, $5);\
      ', [name, image, stockTotal, categoryId, pricePerDay]
    )
    res.sendStatus(201);
  } catch {
    res.sendStatus(500);
  }
});

app.listen(4000);
