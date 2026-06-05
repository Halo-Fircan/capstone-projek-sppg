import fastApiClient from '../../../config/fastapi.js';
import ChatbotRepository from '../repositories/chatbot-repositories.js';

class ChatbotService {
  constructor() {
    this._repository = new ChatbotRepository();
  }

  async createNewChatSession(userId, title) {
    return await this._repository.createSession(userId, title);
  }

  async getUserChatSessions(userId) {
    return await this._repository.getSessionsByUserId(userId);
  }

  async getSessionById(sessionId) {
    const query = {
      text: 'SELECT * FROM chat_sessions WHERE id = $1',
      values: [sessionId],
    };
    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async updateFastapiSessionId(sessionId, fastapiSessionId) {
    const query = {
      text: 'UPDATE chat_sessions SET fastapi_session_id = $2 WHERE id = $1 RETURNING *',
      values: [sessionId, fastapiSessionId],
    };
    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async getChatHistory(sessionId) {
    const messages = await this._repository.getMessagesBySessionId(sessionId);

    return messages.map((msg) => ({
      sender: msg.sender,
      message: msg.message,
      created_at: msg.created_at
    }));
  }

  async clearUserChatData(userId) {
    await this._repository.deleteMessagesByUserId(userId);

    await this._repository.deleteSessionsByUserId(userId);

    return true;
  }

  async sendMessageToAi(userId, sessionId, userMessage) {
    await this._repository.saveMessage(sessionId, 'user', userMessage);
    const sessionData = await this._repository.getSessionById(sessionId);
    const fastapiSessionId = sessionData?.fastapi_session_id || null;
    const contextData = await this._extractContextFromMessage(userMessage);
    const fastapiPayload = {
      session_id: fastapiSessionId,
      message: userMessage,
      context_data: contextData ? {
        nama_wilayah: contextData.nama_wilayah,
        total_siswa: Number(contextData.total_siswa),
        jumlah_sppg_prediksi: Number(contextData.jumlah_sppg_prediksi),
        kebutuhan_sppg: parseFloat(contextData.kebutuhan_sppg),
        gap_prediksi: parseFloat(contextData.gap_prediksi),
        status: contextData.status,
        interpretasi: contextData.interpretasi
      } : {}
    };

    const responseAi = await fastApiClient.post('/chat', fastapiPayload);

    const chatHistoryFromAi = responseAi.data || [];
    let botReply = 'Maaf, saya tidak dapat memproses jawaban saat ini.';
    let newFastapiSessionId = null;

    if (Array.isArray(chatHistoryFromAi) && chatHistoryFromAi.length > 0) {
      const lastMessage = chatHistoryFromAi[chatHistoryFromAi.length - 1];
      botReply = lastMessage.content || botReply;
    } else if (responseAi.data?.reply) {
      botReply = responseAi.data.reply;
    }

    if (responseAi.data?.session_id) {
      newFastapiSessionId = responseAi.data.session_id;
    }

    if (newFastapiSessionId && !fastapiSessionId) {
      await this._repository.updateFastapiSessionId(sessionId, newFastapiSessionId);
    }

    await this._repository.saveMessage(sessionId, 'bot', botReply);

    return {
      sender: 'bot',
      message: botReply,
      context_used: contextData ? contextData.nama_wilayah : null
    };
  }

  async sendPublicMessageToAi(userMessage, clientFastapiSessionId = null) {
    const contextData = await this._extractContextFromMessage(userMessage);

    const fastapiPayload = {
      session_id: clientFastapiSessionId,
      message: userMessage,
      context_data: contextData ? {
        nama_wilayah: contextData.nama_wilayah,
        total_siswa: Number(contextData.total_siswa),
        jumlah_sppg_prediksi: Number(contextData.jumlah_sppg_prediksi),
        kebutuhan_sppg: parseFloat(contextData.kebutuhan_sppg),
        gap_prediksi: parseFloat(contextData.gap_prediksi),
        status: contextData.status,
        interpretasi: contextData.interpretasi
      } : {}
    };

    const responseAi = await fastApiClient.post('/chat', fastapiPayload);

    const chatHistoryFromAi = responseAi.data || [];
    let botReply = 'Halo! Ada yang bisa saya bantu?';
    let activeSessionId = clientFastapiSessionId;

    if (Array.isArray(chatHistoryFromAi) && chatHistoryFromAi.length > 0) {
      const lastMessage = chatHistoryFromAi[chatHistoryFromAi.length - 1];
      botReply = lastMessage.content || botReply;
    } else if (responseAi.data?.reply) {
      botReply = responseAi.data.reply;
    }

    if (responseAi.data?.session_id) {
      activeSessionId = responseAi.data.session_id;
    }

    return {
      sender: 'bot',
      message: botReply,
      fastapi_session_id: activeSessionId,
      context_used: contextData ? contextData.nama_wilayah : null
    };
  }

  async _extractContextFromMessage(message) {
    const stopWords = ['dan', 'dari', 'yang', 'pada', 'bisa', 'ada', 'atau', 'untuk', 'dengan', 'saya', 'sebaran', 'hasil', 'prediksi', 'analisis', 'wilayah', 'kondisi', 'kelayakan'];

    const words = message.split(/\s+/);

    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();

      if (cleanWord.length > 3 && !stopWords.includes(cleanWord)) {
        const foundData = await this._repository.findContextData(cleanWord);
        if (foundData) {
          return foundData;
        }
      }
    }
    return null;
  }
}

export default ChatbotService;