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

app.listen(4000);
