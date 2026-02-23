// Todos los accesos a BD se hacen exclusivamente via Stored Procedures
const pool = require("../config/db");

// GET /api/products
const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_GetAllProducts()");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
};

// GET /api/products/:id
const getById = async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_GetProductById(?)", [req.params.id]);
    if (!rows[0].length) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0][0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
};

// POST /api/products
const create = async (req, res) => {
  const { name, unit_price } = req.body;
  if (!name || unit_price == null)
    return res.status(400).json({ message: "name and unit_price are required" });
  try {
    // El SP inserta y retorna la fila creada en un solo resultado
    const [rows] = await pool.query("CALL sp_CreateProduct(?, ?)", [name, unit_price]);
    res.status(201).json(rows[0][0]);
  } catch (err) {
    res.status(500).json({ message: "Error creating product", error: err.message });
  }
};

// PUT /api/products/:id
const update = async (req, res) => {
  const { name, unit_price } = req.body;
  if (!name || unit_price == null)
    return res.status(400).json({ message: "name and unit_price are required" });
  try {
    // El SP actualiza y retorna la fila actualizada
    const [rows] = await pool.query("CALL sp_UpdateProduct(?, ?, ?)", [req.params.id, name, unit_price]);
    if (!rows[0].length) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0][0]);
  } catch (err) {
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
};

// DELETE /api/products/:id
const remove = async (req, res) => {
  try {
    // El SP elimina y retorna affected_rows
    const [rows] = await pool.query("CALL sp_DeleteProduct(?)", [req.params.id]);
    if (rows[0][0].affected_rows === 0)
      return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2")
      return res.status(409).json({ message: "Cannot delete product: it is used in existing orders" });
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
