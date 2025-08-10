import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { connectDB } from '../lib/db.js';
import { Model } from '../models/Model.js';
import { decryptFile } from '../lib/aes.js';
import crypto from 'crypto';

const router = express.Router();

router.post('/decrypt-and-download', async (req, res) => {
  try {
    console.log(' Decrypt & Download: Request received');

    await connectDB();
    console.log(' Connected to DB');

    const { modelId, userAddress, apiKey } = req.body;
    if (!modelId || !userAddress || !apiKey) {
      console.warn(' Missing fields:', { modelId, userAddress, apiKey });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(' Checking access for user:', userAddress);

    const modelData = await Model.findOne({ apiKeys: { $elemMatch: { user: userAddress, key: apiKey } } });
    if (!modelData) {
      console.warn(' Invalid API key or no access for modelId:', modelId);
      return res.status(403).json({ error: 'Invalid API key or access denied' });
    }

    const { cid, aesKey, iv, modelName = 'model' } = modelData;
    const ipfsGateway = 'https://gateway.pinata.cloud/ipfs';
    const encryptedUrl = `${ipfsGateway}/${cid}`;
    const encryptedPath = path.join('tmp', `${cid}.enc`);
    const decryptedPath = path.join('tmp', `${cid}-decrypted`);

    console.log(`⬇Downloading encrypted model from IPFS: ${encryptedUrl}`);
    const response = await axios.get(encryptedUrl, { responseType: 'arraybuffer' });

    await fs.mkdir('tmp', { recursive: true });
    await fs.writeFile(encryptedPath, response.data);
    console.log(' Encrypted file saved to:', encryptedPath);

  console.log(' Decrypting model file...');
const keyBuffer = Buffer.from(aesKey, 'hex');
const ivBuffer = Buffer.from(iv, 'hex');

await decryptFile(encryptedPath, decryptedPath, keyBuffer, ivBuffer);
console.log(' Model decrypted and saved to:', decryptedPath);


    console.log('📤 Sending decrypted file to user...');

    res.setHeader('Content-Type', 'application/octet-stream');
res.setHeader('Content-Disposition', `attachment; filename="${modelName}.pkl"`);


res.download(decryptedPath, `${modelName}.pkl`, async (err) => {
  await fs.unlink(encryptedPath).catch(() => {});
  await fs.unlink(decryptedPath).catch(() => {});
  if (err) {
    console.error('❌ Error sending file:', err);
  } else {
    console.log('🎉 File sent successfully and cleaned up.');
  }
});


  } catch (err) {
    console.error('❌ Decrypt and download failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
