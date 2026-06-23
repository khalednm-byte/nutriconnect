const jwt = require('jsonwebtoken');

// This middleware runs before any protected route handler.
// It reads the Authorization header, verifies the JWT,
// and attaches the decoded user payload to req.user.
// If the token is missing or invalid, it returns 401 immediately.

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'user') decoded.role = 'patient';
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
