import userRepositories from '../repositories/user-repositories.js';
import redisService from '../../../cache/redis-service.js';
import response from '../../../utils/response.js';
import InvariantError from '../../../exceptions/invariant-error.js';
import NotFoundError from '../../../exceptions/not-found-error.js';

export const createUser = async (req, res, next) => {
  const { name, email, password, role } = req.validated;
  const isEmailExist = await userRepositories.verifyNewEmail(email);

  if (isEmailExist) {
    return next(new InvariantError('Gagal menambahkan user. Email sudah digunakan'));
  }

  const user = await userRepositories.createUser({
    name,
    email,
    password,
    role
  });

  if (!user) {
    return next(new InvariantError('Gagal menambahkan user'));
  }

  return response(res, 201, 'User berhasil ditambahkan', user);
};

export const getUserById = async (req, res, next) => {
  const { userId } = req.params;
  const cacheKey = `user:${userId}`;

  const cachedUser = await redisService.get(cacheKey);
  if (cachedUser) {
    res.setHeader('X-Data-Source', 'cache');
    return response(res, 200, 'User berhasil ditemukan', cachedUser);
  }

  const user = await userRepositories.getUserById(userId);

  if (!user) {
    return next(new NotFoundError('User tidak ditemukan'));
  }

  await redisService.set(cacheKey, user);

  res.setHeader('X-Data-Source', 'database');
  return response(res, 200, 'User berhasil ditemukan', user);
};