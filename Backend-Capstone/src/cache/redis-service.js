import redis from 'redis';

class RedisService {
  constructor() {
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_SERVER || 'localhost'}:6379`;

    this.client = redis.createClient({ url: redisUrl });

    this.client.on('error', (err) => console.error('Redis Client Error', err));

    this.connect();
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async set(key, value, ttl = 3600) {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttl
    });
  }

  async get(key) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async delete(key) {
    await this.client.del(key);
  }
}

export default new RedisService();
