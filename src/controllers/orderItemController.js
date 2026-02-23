// Todos los accesos a BD se hacen exclusivamente via Stored Procedures
const pool = require("../config/db");

// GET /api/orders/:orderId/items
const getItems = async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_GetOrderItems(?)", [req.params.orderId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching items", error: err.message });
  }
};

// POST /api/orders/:orderId/items
const addItem = async (req, res) => {
  const { product_id, qty } = req.body;
  if (!product_id || !qty)
    return res.status(400).json({ message: "product_id and qty are required" });

  try {
    // Verificar orden via SP
    const [check] = await pool.query("CALL sp_GetOrderById(?)", [req.params.orderId]);
    if (!check[0][0]) return res.status(404).json({ message: "Order not found" });
    if (check[0][0].status === "Completed")
      return res.status(403).json({ message: "Cannot modify a Completed order" });

    // SP agrega el item, hace snapshot del precio y retorna el item creado
    const [rows] = await pool.query("CALL sp_AddOrderItem(?, ?, ?)", [req.params.orderId, product_id, qty]);
    res.status(201).json(rows[0][0]);
  } catch (err) {
    res.status(500).json({ message: "Error adding item", error: err.message });
  }
};

// PUT /api/orders/:orderId/items/:itemId
const updateItem = async (req, res) => {
  const { qty, unit_price } = req.body;
  if (!qty) return res.status(400).json({ message: "qty is required" });

  try {
    // Verificar orden via SP
    const [check] = await pool.query("CALL sp_GetOrderById(?)", [req.params.orderId]);
    if (!check[0][0]) return res.status(404).json({ message: "Order not found" });
    if (check[0][0].status === "Completed")
      return res.status(403).json({ message: "Cannot modify a Completed order" });

    // SP actualiza y retorna el item actualizado + affected_rows
    // Si unit_price es null, el SP mantiene el precio actual (COALESCE)
    const [rows] = await pool.query(
      "CALL sp_UpdateOrderItem(?, ?, ?, ?)",
      [req.params.itemId, req.params.orderId, qty, unit_price ?? null]
    );
    const updatedItem = rows[0][0];
    const affectedRows = rows[1][0].affected_rows;

    if (!affectedRows) return res.status(404).json({ message: "Item not found in this order" });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: "Error updating item", error: err.message });
  }
};

// DELETE /api/orders/:orderId/items/:itemId
const removeItem = async (req, res) => {
  try {
    // Verificar orden via SP
    const [check] = await pool.query("CALL sp_GetOrderById(?)", [req.params.orderId]);
    if (!check[0][0]) return res.status(404).json({ message: "Order not found" });
    if (check[0][0].status === "Completed")
      return res.status(403).json({ message: "Cannot modify a Completed order" });

    // SP elimina y retorna affected_rows
    const [rows] = await pool.query("CALL sp_DeleteOrderItem(?, ?)", [req.params.itemId, req.params.orderId]);
    if (rows[0][0].affected_rows === 0)
      return res.status(404).json({ message: "Item not found in this order" });
    res.json({ message: "Item removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error removing item", error: err.message });
  }
};

module.exports = { getItems, addItem, updateItem, removeItem };
