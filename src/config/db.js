const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "orders_db",
  timezone: '-05:00',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 4,        // ← reducido para no exceder el límite del plan
  queueLimit: 0,
});

// Inicializa timezone en cada conexión nueva
const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async () => {
  const conn = await originalGetConnection();
  await conn.query("SET time_zone = '-05:00'");
  return conn;
};

module.exports = pool;