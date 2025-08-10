

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { connectDB } from '../lib/db.js';
import { generateAESKey, encryptFile } from '../lib/aes.js';
import { uploadToIPFS } from '../lib/pinata.js';
import { Model } from '../models/Model.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('model'), async (req, res) => {
  try {
    await connectDB();

    const {
      price,
      uploader,
      modelName,
      description,
      inputFormat, 
    } = req.body;

    const file = req.file;

    if (!file || !price || !uploader || !modelName || !description || !inputFormat) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let parsedInputFormat;
    try {
      parsedInputFormat = JSON.parse(inputFormat);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid inputFormat JSON' });
    }

    const { key, iv } = generateAESKey();
    const encryptedPath = `uploads/${file.filename}.enc`;

    await encryptFile(file.path, encryptedPath, key, iv);

    const cid = await uploadToIPFS(encryptedPath);

    const modelDoc = new Model({
      uploader,
      price,
      cid,
      aesKey: key.toString('hex'),
      iv: iv.toString('hex'),
      modelName,
      description,
      inputFormat: parsedInputFormat,
      uploadedAt: new Date(),
      fileType: path.extname(file.originalname),
      originalFilename: file.originalname,
    });

    await modelDoc.save();

    fs.unlinkSync(file.path);
    fs.unlinkSync(encryptedPath);

    return res.json({ success: true, cid });
  } catch (err) {
    console.error(' Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
