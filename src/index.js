require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes   = require('./routes/orderRoutes');
const verifyToken   = require('./middlewares/verifyToken');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,   // Necesario para enviar/recibir cookies
}));
app.use(express.json());
app.use(cookieParser());

// ── Rutas públicas (sin autenticación) ────────────────────
app.use('/api/auth', authRoutes);

// ── Rutas protegidas (requieren JWT en cookie) ────────────
app.use('/api/products', verifyToken, productRoutes);
app.use('/api/orders',   verifyToken, orderRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Orders API running' }));

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// ── Error global ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
