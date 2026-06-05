import ClientError from '../exceptions/client-error.js';

class AuthenticationError extends ClientError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export default AuthenticationError;