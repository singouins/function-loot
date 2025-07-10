import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import unloadRoute from './routes/unload';
import healthRoute from './routes/health';
import logger from './logger';

logger.info(`Server starting`)
// Load env vars from .env file (if present)
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', healthRoute);      // Route /health
app.use('/item', unloadRoute);  // Route /item/:uuid/unload

// Construct MongoDB URI from env vars
const {
  MONGO_DB_HOST,
  MONGO_DB_USER,
  MONGO_DB_PASS,
  MONGO_DB_BASE
} = process.env;

const mongoUri = `mongodb+srv://${MONGO_DB_USER}:${MONGO_DB_PASS}@${MONGO_DB_HOST}/${MONGO_DB_BASE}?authSource=admin&replicaSet=replicaset`;

// MongoDB Connection
mongoose.connect(mongoUri)
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));

// Custom error handler (must be last)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    msg: err.message || 'Internal Server Error',
    payload: null
  });
});