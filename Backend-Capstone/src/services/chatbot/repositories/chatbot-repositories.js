import pool from '../../../config/database.js';
import { nanoid } from 'nanoid';

class ChatbotRepository {
  constructor() {
    this._pool = pool;
  }

  async createSession(userId, title = 'Obrolan Baru') {
    const id = `session-${nanoid(12)}`;
    const query = {
      text: 'INSERT INTO chat_sessions (id, user_id, title) VALUES ($1, $2, $3) RETURNING *',
      values: [id, userId, title],
    };
    const result = await this._pool.query(query);
    return result.rows[0];
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

  async getSessionsByUserId(userId) {
    const query = {
      text: 'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      values: [userId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async saveMessage(sessionId, sender, message) {
    const id = `msg-${nanoid(12)}`;
    const query = {
      text: 'INSERT INTO chat_messages (id, session_id, sender, message) VALUES ($1, $2, $3, $4) RETURNING *',
      values: [id, sessionId, sender, message],
    };
    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async getMessagesBySessionId(sessionId) {
    const query = {
      text: 'SELECT sender, message, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      values: [sessionId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async findContextData(namaWilayah) {
    const query = {
      text: `
        SELECT nama_wilayah, total_siswa, jumlah_sppg_prediksi, kebutuhan_sppg, gap_prediksi, status, interpretasi
        FROM sppg_analyses
        WHERE LOWER(nama_wilayah) ILIKE LOWER($1)
        ORDER BY created_at DESC
        LIMIT 1
      `,
      values: [`%${namaWilayah}%`],
    };
    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async deleteMessagesByUserId(userId) {
    const query = {
      text: `
      DELETE FROM chat_messages 
      WHERE session_id IN (
        SELECT id FROM chat_sessions WHERE user_id = $1
      )
    `,
      values: [userId],
    };
    return await this._pool.query(query);
  }

  async deleteSessionsByUserId(userId) {
    const query = {
      text: 'DELETE FROM chat_sessions WHERE user_id = $1',
      values: [userId],
    };
    return await this._pool.query(query);
  }

}

export default ChatbotRepository;