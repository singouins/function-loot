import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from '../logger';

dotenv.config();

const {
  MONGO_DB_HOST,
  MONGO_DB_USER,
  MONGO_DB_PASS,
  MONGO_DB_BASE
} = process.env;

const mongoUri = `mongodb+srv://${MONGO_DB_USER}:${MONGO_DB_PASS}@${MONGO_DB_HOST}/${MONGO_DB_BASE}?authSource=admin&replicaSet=replicaset`;

export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error(`MongoDB connection error: ${err}`);
    throw err;
  }
}
