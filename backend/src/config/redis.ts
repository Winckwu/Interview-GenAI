import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Cache Configuration
 * Used for session management, caching, and real-time data
 */

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Max Redis reconnection attempts reached');
        return new Error('Max retries reached');
      }
      return retries * 50;
    },
  },
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

export default redisClient;
