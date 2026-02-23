-- ============================================================
-- orders_db - Database Schema
-- Run this file once to initialize your database
-- ============================================================

CREATE DATABASE IF NOT EXISTS orders_db;
USE orders_db;

-- ------------------------------------------------------------
-- Products catalog
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(150)   NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_number  VARCHAR(50)  NOT NULL UNIQUE,
  date          DATE         NOT NULL,
  status        ENUM('Pending','InProgress','Completed') DEFAULT 'Pending',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Order items (products inside an order)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT            NOT NULL,
  product_id  INT            NOT NULL,
  qty         INT            NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2)  NOT NULL,  -- snapshot of price at time of order
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- Seed: 3 default products
-- ------------------------------------------------------------
INSERT IGNORE INTO products (id, name, unit_price) VALUES
  (1, 'Laptop Pro 15"',  1299.99),
  (2, 'Wireless Mouse',    29.99),
  (3, 'USB-C Hub',         49.99);
