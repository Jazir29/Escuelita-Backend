const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "orders_db",
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración de zona horaria para el driver
  timezone: "-05:00", 
  // Configuración para no exceder el límite de Clever Cloud
  waitForConnections: true,
  connectionLimit: 5, // Bajamos de 10 a 5 por el límite de tu plan
  queueLimit: 0,
});

// Esta función fuerza a MySQL a usar tu horario local en cada conexión
pool.on('connection', function (connection) {
  connection.query("SET time_zone = '-05:00';");
});

module.exports = pool;