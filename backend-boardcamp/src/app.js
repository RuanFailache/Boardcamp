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
    const categoriesNames = categories.rows.map((category) => category.name)

    if (categoriesNames.includes(name)) {
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
        games.*,
        categories.name AS "categoryName"
      FROM games
        JOIN categories
          ON games."categoryId" = categories.id
      WHERE games.name ILIKE $1;`, [name ? name + "%" : "%"]
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

  const categories = await db.query("SELECT * FROM categories;");
  const categoriesIds = categories.rows.map((category) => category.id);
  
  const games = await db.query("SELECT * FROM games;");
  const gamesNames = games.rows.map((game) => game.name);

  if (name === "" || stockTotal <= 0 || pricePerDay <= 0 || !categoriesIds.includes(categoryId)) {
    res.sendStatus(400);
    return;
  } else if (gamesNames.includes(name)) {
    res.sendStatus(409);
    return;
  }

  try {
    await db.query(
      `INSERT INTO games (
        name,
        image, 
        "stockTotal", 
        "categoryId", 
        "pricePerDay"
      ) VALUES ($1, $2, $3, $4, $5);`, 
      [name, image, stockTotal, categoryId, pricePerDay]
    )
    res.sendStatus(201);
  } catch {
    res.sendStatus(500);
  }
});

// Customers
app.get("/customers", async (req, res) => {
  const cpf = req.query.cpf;

  try {
    const customers = await db.query(`
      SELECT * FROM customers
        WHERE cpf ILIKE $1;
    `, [cpf ? cpf + "%" : "%"]);

    res.send(customers.rows)
  } catch {
    res.sendStatus(500);
  }
})

app.listen(4000);
