import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import logger from '../utils/logger.js';

const computeStorageRoot = () => {
  const envRoot = process.env.ASSET_STORAGE_ROOT;
  if (envRoot) {
    return path.resolve(envRoot);
  }

  if (process.env.VERCEL) {
    return path.join('/tmp', 'builtattic-storage');
  }

  return path.resolve(process.cwd(), 'storage');
};

const STORAGE_ROOT = computeStorageRoot();
const SECURE_DIR = path.join(STORAGE_ROOT, 'secure');
let warnedEphemeral = false;

function ensureDirs() {
  try {
    fs.mkdirSync(SECURE_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to prepare storage directory', {
      storageRoot: STORAGE_ROOT,
      error: error.message,
    });
    throw error;
  }
}

function getEncryptionKey() {
  const key = process.env.FILE_ENCRYPTION_KEY;
  if (key && key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  // fallback demo key (32 bytes zero padded) – in production require env
  return crypto.createHash('sha256').update(process.env.FILE_ENCRYPTION_KEY || 'builtattic-demo-key').digest();
}

export async function storeEncryptedBuffer(buffer, { filename }) {
  ensureDirs();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.bin`;
  const storagePath = path.join(SECURE_DIR, key);
  fs.writeFileSync(storagePath, encrypted);
  const result = {
    key,
    storagePath,
    sizeBytes: buffer.length,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    checksum,
    originalName: filename,
  };
  if (process.env.VERCEL && !warnedEphemeral) {
    warnedEphemeral = true;
    logger.warn(
      'Asset stored on ephemeral filesystem. Configure persistent storage (e.g. S3, Vercel Blob) for production use.',
      { storageRoot: STORAGE_ROOT }
    );
  }
  return result;
}

export function generateDownloadToken(assetId, { expiresIn = '10m' } = {}) {
  const secret = process.env.ASSET_TOKEN_SECRET || 'builtattic-asset-secret';
  return jwt.sign({ sub: String(assetId) }, secret, { expiresIn });
}

export function verifyDownloadToken(token) {
  const secret = process.env.ASSET_TOKEN_SECRET || 'builtattic-asset-secret';
  return jwt.verify(token, secret);
}

export function readDecryptedAsset(asset) {
  const filePath = asset.storagePath || path.join(SECURE_DIR, asset.key);
  const encrypted = fs.readFileSync(filePath);
  const decipher = crypto.createDecipheriv(
    asset.algorithm || 'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(asset.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(asset.authTag, 'hex'));
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted;
}
