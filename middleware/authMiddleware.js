import jwt from 'jsonwebtoken';

// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
  console.log('🚀 authenticateJWT middleware called!');
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Request method:', req.method);
  console.log('🔍 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Authentication failed: No Bearer token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-key-2024-health-app';
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token verified successfully for user:', decoded.id);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    } else {
      return res.status(401).json({ error: 'Authentication failed. Please log in again.' });
    }
  }
};

export default authenticateJWT; 