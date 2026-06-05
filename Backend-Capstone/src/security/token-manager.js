import jwt from 'jsonwebtoken';
import InvariantError from '../exceptions/invariant-error.js';

const TokenManager = {
  generateAccessToken: (payload) => jwt.sign(payload, process.env.ACCESS_TOKEN_KEY),
  generateRefreshToken: (payload) => jwt.sign(payload, process.env.REFRESH_TOKEN_KEY),
  verifyRefreshToken: (refreshToken) => {
    try {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
      return payload;
    } catch (error) {
      console.error(error);
      throw new InvariantError('Refresh token tidak valid');
    }
  },
  verifyAccessToken: (accessToken) => {
    try {
      const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
      return payload;
    } catch (error) {
      console.error(error);
      throw new InvariantError('Access token tidak valid');
    }
  }
};

export default TokenManager;