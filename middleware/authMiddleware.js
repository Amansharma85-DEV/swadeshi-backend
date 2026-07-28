const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
      errors: ['Authentication token is required']
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'swadeshi_prod_secret_key_2026');
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid or expired authentication token.',
      errors: [error.message]
    });
  }
};

module.exports = { protect };
