require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const productRoutes = require("./routes/productRoutes");
const orderRoutes   = require("./routes/orderRoutes");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/orders",   orderRoutes);

// ── Health check ───────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", message: "Orders API running" }));

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
