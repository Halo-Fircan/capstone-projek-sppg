import TokenManager from '../security/token-manager.js';
import AuthenticationError from '../exceptions/authentication-error.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = TokenManager.verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};

export default authMiddleware;