import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    autoIndex: true, // In dev/test autoIndex is good; can be toggled
  };

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, options);
    isConnected = true;
    logger.info({ host: conn.connection.host, name: conn.connection.name }, 'Connected to MongoDB');

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB runtime error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to connect to MongoDB');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  }
}
