const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const COOKIE_NAME = 'auth_token';
const COOKIE_OPTS = {
  httpOnly: true,       // JS no puede leer la cookie
  secure: true,        // Cambiar a true en producción (HTTPS)
  sameSite: 'none',
  maxAge: 8 * 60 * 60 * 1000, // 8 horas
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });

  try {
    // Buscar usuario via SP
    const [rows] = await pool.query('CALL sp_GetUserByEmail(?)', [email]);
    const user = rows[0][0];

    if (!user)
      return res.status(401).json({ message: 'Credenciales incorrectas' });

    // Verificar contraseña
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Credenciales incorrectas' });

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Guardar en cookie httpOnly (no en localStorage)
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

    res.json({
      message: 'Login exitoso',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
  console.error('ERROR LOGIN:', err.message); // ← aquí en login
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
}
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: 'Sesión cerrada' });
};

// GET /api/auth/me  — verifica si hay sesión activa
const me = (req, res) => {
  // req.user viene del middleware verifyToken
  res.json({ user: req.user });
};


// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });

  try {
    // Verificar si el email ya existe
    const [existing] = await pool.query('CALL sp_GetUserByEmail(?)', [email]);
    if (existing[0][0])
      return res.status(409).json({ message: 'El email ya está registrado' });

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario via SP
    const [rows] = await pool.query('CALL sp_CreateUser(?, ?, ?)', [name, email, hashedPassword]);
    const newUser = rows[0][0];

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: newUser
    });
  } catch (err) {
  console.error('ERROR LOGIN:', err.message); // ← agrega esto
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
}
};

module.exports = { login, logout, me, register };
