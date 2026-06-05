import AuthenticationRepositories from '../repositories/authentication-repositories.js';
import userRepositories from '../../users/repositories/user-repositories.js';
import TokenManager from '../../../security/token-manager.js';
import response from '../../../utils/response.js';
import InvariantError from '../../../exceptions/invariant-error.js';
import AuthenticationError from '../../../exceptions/authentication-error.js';
import ChatbotService from '../../chatbot/services/chatbot-service.js';

const chatbotService = new ChatbotService();

export const login = async (req, res, next) => {
  const { email, password } = req.validated;

  const user = await userRepositories.verifyUserCredential(email, password);
  if (!user) {
    return next(new AuthenticationError('Kredensial yang Anda berikan salah'));
  }

  const accessToken = TokenManager.generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = TokenManager.generateRefreshToken({ id: user.id, role: user.role });

  await AuthenticationRepositories.addRefreshToken(refreshToken);

  return response(res, 200, 'Authentication berhasil ditambahkan', {
    accessToken,
    refreshToken
  });
};

export const refreshToken = async (req, res, next) => {
  const { refreshToken } = req.validated;

  const result = await AuthenticationRepositories.verifyRefreshToken(refreshToken);

  if (!result) {
    return next(new InvariantError('Refresh token tidak valid'));
  }

  const { id, role } = TokenManager.verifyRefreshToken(refreshToken);
  const accessToken = TokenManager.generateAccessToken({ id, role });

  return response(res, 200, 'Access token berhasil diperbarui', { accessToken });
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.validated;

    const result = await AuthenticationRepositories.verifyRefreshToken(refreshToken);

    if (!result) {
      return next(new InvariantError('Refresh token tidak valid'));
    }

    // 🛠️ AMBIL ID USER DARI REFRESH TOKEN SEBELUM DIHAPUS
    const { id: userId } = TokenManager.verifyRefreshToken(refreshToken);

    // 🛠️ EKSEKUSI PEMBERSIHAN DATA CHATBOT DI POSTGRESQL
    if (userId) {
      await chatbotService.clearUserChatData(userId);
    }

    // Hapus token dari database authentication
    await AuthenticationRepositories.deleteRefreshToken(refreshToken);

    return response(res, 200, 'Logout berhasil dan riwayat chat telah dibersihkan');
  } catch (error) {
    next(error); // Lempar ke error handler jika terjadi kendala tak terduga
  }
};

export default {
  login,
  refreshToken,
  logout
};