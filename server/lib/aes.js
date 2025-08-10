import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export function generateAESKey() {
  const key = crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  return { key, iv };
}

export function encryptFile(inputPath, outputPath, key, iv) {
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  return new Promise((resolve, reject) => {
    input.pipe(cipher).pipe(output)
      .on('finish', () => resolve())
      .on('error', reject);
  });
}

export function decryptFile(inputPath, outputPath, key, iv) {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  return new Promise((resolve, reject) => {
    input.pipe(decipher).pipe(output)
      .on('finish', () => resolve())
      .on('error', reject);
  });
}

export function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}
