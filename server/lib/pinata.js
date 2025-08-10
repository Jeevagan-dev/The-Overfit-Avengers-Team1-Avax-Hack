// lib/pinata.js
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET;
const PINATA_BASE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

export async function uploadToIPFS(filePath) {
  const data = new FormData();
  data.append('file', fs.createReadStream(filePath));

  try {
    const res = await axios.post(PINATA_BASE_URL, data, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
    });

    return res.data.IpfsHash; 
  } catch (err) {
    console.error('❌ Pinata upload error:', err.response?.data || err.message);
    throw err;
  }
}
