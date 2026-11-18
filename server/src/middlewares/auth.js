import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'queueme_dev_jwt_secret_fallback_key';

/**
 * Authentication middleware that requires a valid Bearer JWT.
 * Attaches req.userId and req.user to the request object.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token expired',
        expired: true,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }
}
