/*
Owner: Team
Sets up a single reusable connection pool to Microsoft SQL Server.
Every controller imports { poolPromise, sql } from this file instead of
opening its own connection, to not leak connections under load.
 */

const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log(" Connected to MSSQL Server:", process.env.DB_DATABASE);
    return pool;
  })
  .catch((err) => {
    console.error(" Database Connection Failed:", err.message);
    throw err;
  });

poolPromise.catch(() => {});

module.exports = { sql, poolPromise };
