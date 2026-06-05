import ChatbotService from '../services/chatbot-service.js';
import responseHelper from '../../../utils/response.js';

class ChatbotController {
  constructor() {
    this._service = new ChatbotService();
    this.postSessionHandler = this.postSessionHandler.bind(this);
    this.getSessionsHandler = this.getSessionsHandler.bind(this);
    this.getMessagesHandler = this.getMessagesHandler.bind(this);
    this.postMessageHandler = this.postMessageHandler.bind(this);
    this.postPublicMessageHandler = this.postPublicMessageHandler.bind(this);
  }

  async postSessionHandler(req, res, next) {
    try {
      const userId = req.user.id;
      const { title } = req.body;
      const session = await this._service.createNewChatSession(userId, title);
      return responseHelper(res, 201, 'Sesi obrolan baru berhasil dibuat', session);
    } catch (error) {
      next(error);
    }
  }

  async getSessionsHandler(req, res, next) {
    try {
      const userId = req.user.id;
      const sessions = await this._service.getUserChatSessions(userId);
      return responseHelper(res, 200, 'Berhasil memuat daftar sesi obrolan', sessions);
    } catch (error) {
      next(error);
    }
  }

  async getMessagesHandler(req, res, next) {
    try {
      const { sessionId } = req.params;
      const history = await this._service.getChatHistory(sessionId);
      return responseHelper(res, 200, 'Berhasil memuat riwayat obrolan', history);
    } catch (error) {
      next(error);
    }
  }

  async postMessageHandler(req, res, next) {
    try {
      const userId = req.user.id;
      const { sessionId, message } = req.body;

      if (!sessionId || !message) {
        return responseHelper(res, 400, 'Session ID dan pesan wajib diisi.');
      }

      const aiResponse = await this._service.sendMessageToAi(userId, sessionId, message);
      return responseHelper(res, 200, 'Pesan berhasil diproses oleh AI', aiResponse);
    } catch (error) {
      next(error);
    }
  }

  async postPublicMessageHandler(req, res, next) {
    try {
      const { message, fastapi_session_id } = req.body;

      if (!message) {
        return responseHelper(res, 400, 'Pesan wajib diisi.');
      }

      const aiResponse = await this._service.sendPublicMessageToAi(message, fastapi_session_id || null);

      return responseHelper(res, 200, 'Pesan publik berhasil diproses oleh AI', aiResponse);
    } catch (error) {
      next(error);
    }
  }
}

export default ChatbotController;