// Todos los accesos a BD se hacen exclusivamente via Stored Procedures
const pool = require("../config/db");

// Helper: parsea los 2 result sets que devuelve sp_GetOrderById
function parseOrderResult(result) {
  const header = result[0][0];
  if (!header) return null;
  const items = result[1] || [];
  return { ...header, final_price: parseFloat(header.final_price), items };
}

// GET /api/orders
const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_GetAllOrders()");
    const orders = rows[0].map(o => ({ ...o, final_price: parseFloat(o.final_price) }));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener órdenes", error: err.message });
  }
};

// GET /api/orders/:id
const getById = async (req, res) => {
  try {
    const [result] = await pool.query("CALL sp_GetOrderById(?)", [req.params.id]);
    const order = parseOrderResult(result);
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener orden", error: err.message });
  }
};

// POST /api/orders
const create = async (req, res) => {
  const { date, items } = req.body;
  if (!date)
    return res.status(400).json({ message: "fecha es requerida" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // SP genera el order_number automáticamente y retorna la orden creada
    const [created] = await conn.query("CALL sp_CreateOrder(?)", [date]);
    const orderId = created[0][0].id;

    // SP agrega cada item — toda la lógica (snapshot de precio) vive en el SP
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.product_id || !item.qty)
          throw new Error("Cada item requiere product_id y qty");
        await conn.query("CALL sp_AddOrderItem(?, ?, ?)", [orderId, item.product_id, item.qty]);
      }
    }

    await conn.commit();

    // Retorna la orden completa con items y totales calculados
    const [result] = await conn.query("CALL sp_GetOrderById(?)", [orderId]);
    res.status(201).json(parseOrderResult(result));
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Número de orden ya existe" });
    res.status(500).json({ message: "Error al crear orden", error: err.message });
  } finally {
    conn.release();
  }
};

// PUT /api/orders/:id
const update = async (req, res) => {
  const { order_number, date, items } = req.body;
  if (!order_number || !date)
    return res.status(400).json({ message: "order_number y fecha son requeridos" });

  const conn = await pool.getConnection();
  try {
    // Verificar que existe y no está Completed — todo via SP
    const [check] = await conn.query("CALL sp_GetOrderById(?)", [req.params.id]);
    const existing = parseOrderResult(check);
    if (!existing) return res.status(404).json({ message: "Orden no encontrada" });
    if (existing.status === "Completado")
      return res.status(403).json({ message: "No se puede modificar una orden completada" });

    await conn.beginTransaction();

    // Actualizar header
    await conn.query("CALL sp_UpdateOrder(?, ?, ?)", [req.params.id, order_number, date]);

    // Limpiar todos los items via SP y re-insertar
    await conn.query("CALL sp_ClearOrderItems(?)", [req.params.id]);

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.product_id || !item.qty)
          throw new Error("Cada item requiere product_id y qty");
        await conn.query("CALL sp_AddOrderItem(?, ?, ?)", [req.params.id, item.product_id, item.qty]);
      }
    }

    await conn.commit();

    const [result] = await conn.query("CALL sp_GetOrderById(?)", [req.params.id]);
    res.json(parseOrderResult(result));
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Número de orden ya existe" });
    res.status(500).json({ message: "Error al actualizar orden", error: err.message });
  } finally {
    conn.release();
  }
};

// PATCH /api/orders/:id/status
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ["Pendiente", "En Proceso", "Completado"];
  if (!valid.includes(status))
    return res.status(400).json({ message: `estado tiene que ser uno de: ${valid.join(", ")}` });

  try {
    const [check] = await pool.query("CALL sp_GetOrderById(?)", [req.params.id]);
    const existing = parseOrderResult(check);
    if (!existing) return res.status(404).json({ message: "Orden no encontrada" });
    if (existing.status === "Completado")
      return res.status(403).json({ message: "No se puede cambiar el estado de una orden completada" });

    // SP actualiza status y devuelve la orden actualizada
    const [result] = await pool.query("CALL sp_UpdateOrderStatus(?, ?)", [req.params.id, status]);
    res.json(parseOrderResult(result));
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar estado", error: err.message });
  }
};

// DELETE /api/orders/:id
const remove = async (req, res) => {
  try {
    const [check] = await pool.query("CALL sp_GetOrderById(?)", [req.params.id]);
    const existing = parseOrderResult(check);
    if (!existing) return res.status(404).json({ message: "Orden no encontrada" });
    if (existing.status === "Completado")
      return res.status(403).json({ message: "No se puede eliminar una orden completada" });

    // SP elimina y devuelve affected_rows
    const [rows] = await pool.query("CALL sp_DeleteOrder(?)", [req.params.id]);
    if (rows[0][0].affected_rows === 0)
      return res.status(404).json({ message: "Orden no encontrada" });
    res.json({ message: "Orden eliminada exitosamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar orden", error: err.message });
  }
};

module.exports = { getAll, getById, create, update, updateStatus, remove };