const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "orders_db",
  timezone: '-05:00',   // ← Lima (UTC-5)
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Fuerza la zona horaria de Lima en cada conexión
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '-05:00'");
});

module.exports = pool;