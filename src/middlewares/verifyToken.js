const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token)
    return res.status(401).json({ message: 'No autorizado — inicia sesión' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('auth_token');
    return res.status(401).json({ message: 'Sesión expirada — inicia sesión nuevamente' });
  }
};

module.exports = verifyToken;
