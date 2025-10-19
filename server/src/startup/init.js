import mongoose from 'mongoose';

import { loadSecrets } from '../config/secrets.js';
import logger from '../utils/logger.js';

let initialisePromise;

const resolveMongoUri = () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI missing in configuration');
  }
  return uri;
};

const resolveDbName = () => process.env.MONGO_DBNAME || process.env.MONGODB_DB || 'builtattic_dev';

const connectMongo = async () => {
  const uri = resolveMongoUri();
  const dbName = resolveDbName();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName });
  logger.info('Mongo connected', { dbName });
  return mongoose.connection;
};

export const initialiseInfrastructure = async () => {
  if (initialisePromise) {
    return initialisePromise;
  }

  initialisePromise = (async () => {
    await loadSecrets();
    return connectMongo();
  })().catch((error) => {
    initialisePromise = undefined;
    throw error;
  });

  return initialisePromise;
};

export const disconnectInfrastructure = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  initialisePromise = undefined;
};
