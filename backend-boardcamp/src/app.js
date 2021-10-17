import express from "express";
import pg from "pg";
import dayjs from "dayjs";

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
    const categoriesNames = categories.rows.map((category) => category.name);

    if (categoriesNames.includes(name)) {
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
  const name = req.query.name;

  try {
    const games = await db.query(
      `SELECT
        games.*,
        categories.name AS "categoryName"
      FROM games
        JOIN categories
          ON games."categoryId" = categories.id
      WHERE games.name ILIKE $1;`,
      [name ? name + "%" : "%"]
    );
    res.send(games.rows);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/games", async (req, res) => {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

  const categories = await db.query("SELECT * FROM categories;");
  const categoriesIds = categories.rows.map((category) => category.id);

  const games = await db.query("SELECT * FROM games;");
  const gamesNames = games.rows.map((game) => game.name);

  if (
    name === "" ||
    stockTotal <= 0 ||
    pricePerDay <= 0 ||
    !categoriesIds.includes(categoryId)
  ) {
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
    );
    res.sendStatus(201);
  } catch {
    res.sendStatus(500);
  }
});

// Customers
const checkCustomersData = (data) => {
  const cpfRegEx = new RegExp(/^[0-9]{11}$/);
  const phoneRegEx = new RegExp(/^[0-9]{10}([0-9])?$/);
  const birthdayRegEx = new RegExp(
    /^(1[9][0-9]{2}|2[0]([01][0-9]|2[01]))-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
  );

  return (
    data.name.length < 3 ||
    !cpfRegEx.test(data.cpf) ||
    !phoneRegEx.test(data.phone) ||
    !birthdayRegEx.test(data.birthday)
  );
};

app.get("/customers", async (req, res) => {
  const cpf = req.query.cpf;

  try {
    const customers = await db.query(
      `
      SELECT * FROM customers
        WHERE cpf ILIKE $1;
    `,
      [cpf ? cpf + "%" : "%"]
    );

    res.send(customers.rows);
  } catch {
    res.sendStatus(500);
  }
});

app.get("/customers/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const customers = await db.query(`SELECT * FROM customers;`);
    const customersIds = customers.rows.map((c) => c.id);

    if (!customersIds.includes(id)) {
      res.sendStatus(404);
      return;
    }

    const customer = await db.query(
      `
      SELECT * FROM customers WHERE id = $1;
    `,
      [id]
    );

    res.send(customer.rows[0]);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/customers", async (req, res) => {
  const body = req.body;

  if (checkCustomersData(body)) {
    res.sendStatus(400);
    return;
  }

  try {
    const customers = await db.query(`SELECT * FROM customers;`);
    const customersCpfs = customers.rows.map((c) => c.cpf);

    if (customersCpfs.includes(body.cpf)) {
      res.sendStatus(409);
      return;
    }

    await db.query(
      `
      INSERT INTO customers 
        (name, phone, cpf, birthday) 
      VALUES 
        ($1, $2, $3, $4);`,
      [body.name, body.phone, body.cpf, body.birthday]
    );

    res.sendStatus(201);
  } catch (err) {
    res.sendStatus(500);
  }
});

app.put("/customers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body;

  try {
    const customers = await db.query(`SELECT * FROM customers;`);
    const customersIds = customers.rows.map((c) => c.id);
    const customersCpfs = customers.rows.map((c) => c.cpf);

    if (customersCpfs.includes(body.cpf)) {
      res.sendStatus(409);
      return;
    }

    if (!customersIds.includes(id)) {
      res.sendStatus(404);
      return;
    }

    if (checkCustomersData(body)) {
      res.sendStatus(400);
      return;
    }

    await db.query(
      `
      UPDATE customers SET
        name = $1,
        phone = $2,
        cpf = $3,
        birthday = $4
      WHERE id = $5;
    `,
      [body.name, body.phone, body.cpf, body.birthday, id]
    );

    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
});

// Rentals
app.get("/rentals", async (req, res) => {
  const qCostId = Number(req.query.customerId);
  const qGameId = Number(req.query.gameId);

  try {
    const rentalsData = await db.query("SELECT * FROM rentals;");

    const customers = [];
    const games = [];

    for (let rental of rentalsData.rows) {
      const customer = await db.query(
        "SELECT * FROM customers WHERE id = $1;",
        [rental.customerId]
      );
      const game = await db.query(
        "SELECT * FROM games WHERE id = $1;", 
        [rental.gameId]
      );
      const category = await db.query(
        "SELECT * FROM categories WHERE id = $1",
        [game.rows[0].categoryId]
      );

      customers.push({
        id: customer.rows[0].id,
        name: customer.rows[0].name,
      });
      games.push({
        id: game.rows[0].id,
        name: game.rows[0].name,
        categoryId: category.rows[0].id,
        categoryName: category.rows[0].name,
      });
    }

    let rentals = rentalsData.rows.map((rental, i) => ({
      ...rentalsData.rows[i],
      customer: customers[i],
      game: games[i],
    }));

    if (qCostId) {
      rentals = rentals.filter(rental => rental.customerId === qCostId);
    }

    if (qGameId) {
      rentals = rentals.filter(rental => rental.gameId === qGameId);
    }

    res.send(rentals);
  } catch {
    res.sendStatus(500);
  }
});

app.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;

  try {
    const customers = await db.query(`SELECT * FROM customers;`);
    const customer = customers.rows.find((c) => c.id === customerId);

    const games = await db.query(`SELECT * FROM games;`);
    const game = games.rows.find((g) => g.id === gameId);

    const rentals = await db.query(`SELECT * FROM rentals;`);
    const gamesRented = rentals.rows.filter(
      (rental) => rental.gameId === gameId
    );

    if (
      customer === undefined ||
      game === undefined ||
      daysRented <= 0 ||
      gamesRented.length >= game.stockTotal
    ) {
      console.log(game);
      res.sendStatus(400);
      return;
    }

    const originalPrice = game.pricePerDay * daysRented;
    const rentDate = dayjs().format("YYYY-MM-DD");
    const returnDate = null;
    const delayFee = null;

    await db.query(
      `INSERT INTO rentals
         ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7);
    `,
      [
        customerId,
        gameId,
        rentDate,
        daysRented,
        returnDate,
        originalPrice,
        delayFee,
      ]
    );

    res.sendStatus(201);
  } catch {
    res.sendStatus(500);
  }
});

app.listen(4000);
