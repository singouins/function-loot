// src/redisClient.ts
import Redis from 'ioredis';
import logger from '../logger';

// Initialize immediately
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  db: Number(process.env.REDIS_DB) || 0,
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (error: Error) => {
  logger.error(`Redis client error: ${error.message}`, { error });
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.warn('Redis client reconnecting');
});

export default redis;
