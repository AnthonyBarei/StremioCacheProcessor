import Redis, { Redis as RedisClient } from 'ioredis';

class Database {
  private url: string;
  private client!: RedisClient;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    this.client = new Redis(this.url);
    this.client.on('connect', () => console.log('Connected to db server.'));
    this.client.on('error', (error) => { console.error('Error db server:', error); process.exit(1); });
  }

  async get(key: string, json = false): Promise<any> {
    try {
      let data = await this.client.get(key);
      if (data !== null && json) {
        data = JSON.parse(data);
      }      
      return data;
    } catch (error) {
      console.error('Error retrieving data from the database:', error);
      throw error;
    }
  }

  async save(key: string, data: any): Promise<void> {
    try {
      if (typeof data === 'object') data = JSON.stringify(data);
      await this.client.set(key, data);
    } catch (error) {
      console.error('Error saving data to the database:', error);
      throw error;
    }
  }

  async update(key: string, data: any): Promise<void> {
    try {
      if (typeof data === 'object') data = JSON.stringify(data);
      await this.client.set(key, data);
    } catch (error) {
      console.error('Error updating data in the database:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting data from the database:', error);
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      console.error('Error deleting all data from the database:', error);
      throw error;
    }
  }
}

export default Database;