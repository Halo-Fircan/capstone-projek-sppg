import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';

class UserRepositories {
  constructor() {
    this.pool = new Pool();
  }

  async createUser({ name, email, password, role = 'user' }) {
    const id = nanoid(16);
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO users(id, name, email, password, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, name, email, hashedPassword, role, createdAt, updatedAt],
    };

    const result = await this.pool.query(query);

    return result.rows[0];
  }

  async verifyNewEmail(email) {
    const query = {
      text: 'SELECT email FROM users WHERE email = $1',
      values: [email],
    };
    const result = await this.pool.query(query);
    return result.rows.length > 0;
  }

  async getUserById(id) {
    const query = {
      text: 'SELECT id, name, email, role FROM users WHERE id = $1',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      return null;
    }

    return result.rows[0];
  }

  async verifyUserCredential(email, password) {
    const query = {
      text: 'SELECT id, password, role FROM users WHERE email = $1',
      values: [email],
    };
    const result = await this.pool.query(query);

    if (result.rows.length === 0) {
      return null;
    }

    const { id, password: hashedPassword, role } = result.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      return null;
    }

    return { id, role };
  }
}

export default new UserRepositories();