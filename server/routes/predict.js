
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import { connectDB } from '../lib/db.js';
import { Model } from '../models/Model.js';
import { decryptFile } from '../lib/aes.js';
import { ethers } from 'ethers';
import contractABI from '../abi/ModelMarketplace.json' with { type: 'json' };

const router = express.Router();

const contractAddress = process.env.CONTRACT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(contractAddress, contractABI, provider);
const signer = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

function runPrediction(modelPath, inputData) {
  return new Promise((resolve, reject) => {
    const python = spawn('./.venv/bin/python', ['predict.py', modelPath, JSON.stringify(inputData)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    python.stdout.setEncoding('utf8');
    python.stderr.setEncoding('utf8');

    let output = '';
    let errorOutput = '';

    const timeout = setTimeout(() => {
      python.kill('SIGKILL');
      reject(new Error('Prediction timed out'));
    }, 30000); 
    python.stdout.on('data', (data) => (output += data));
    python.stderr.on('data', (data) => (errorOutput += data));

   python.on('close', (code) => {
  clearTimeout(timeout);
  if (code !== 0) {
    console.error('Python stdout:', output);
    console.error('Python stderr:', errorOutput);
    reject(new Error(`Python exited with code ${code}`));
  } else if (errorOutput) {
    console.warn('Python warnings/errors:', errorOutput);
    resolve(output.trim());
  } else {
    resolve(output.trim());
  }
});

  });
}

router.post('/predict', async (req, res) => {
  try {
    console.log(' Prediction request received');
    await connectDB();

    const { modelId, userAddress, apiKey, inputData } = req.body;
    if (!modelId || !userAddress || !apiKey || !inputData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const modelData = await Model.findOne({
      cid: modelId,
      apiKeys: { $elemMatch: { user: userAddress, key: apiKey } }
    });

    if (!modelData) {
      return res.status(403).json({ error: 'Invalid API key or access denied' });
    }

    let creditEntry = modelData.localCredits.find(entry => entry.user === userAddress);
    if (!creditEntry) {
      creditEntry = { user: userAddress, remaining: 0, lastSyncedAt: null };
      modelData.localCredits.push(creditEntry);
    }
    if (creditEntry.remaining === 0) {
      const onChainCredits = await contract.userCredits(userAddress, modelId);
      creditEntry.remaining = Number(onChainCredits);
      creditEntry.lastSyncedAt = new Date();
      modelData.markModified('localCredits');
      await modelData.save();
      console.log('🔄 Synced credits from smart contract:', creditEntry.remaining);
    }
    if (creditEntry.remaining <= 0) {
      return res.status(402).json({ error: 'No credits remaining. Please purchase more credits.' });
    }

    const { cid, aesKey, iv } = modelData;
    const encryptedUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const encryptedPath = path.join('tmp', `${cid}.enc`);
    const decryptedPath = path.join('tmp', `${cid}-decrypted`);

    const response = await axios.get(encryptedUrl, { responseType: 'arraybuffer' });
    await fs.mkdir('tmp', { recursive: true });
    await fs.writeFile(encryptedPath, response.data);

    const keyBuffer = Buffer.from(aesKey, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    await decryptFile(encryptedPath, decryptedPath, keyBuffer, ivBuffer);

    console.log(' Running prediction...');
    const predictionResultRaw = await runPrediction(decryptedPath, inputData);

    const modelBuffer = await fs.readFile(decryptedPath);
    const modelHash = ethers.keccak256(modelBuffer);
    const inputHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(inputData)));
    const outputHash = ethers.keccak256(ethers.toUtf8Bytes(predictionResultRaw));
    const proofMessage = ethers.solidityPackedKeccak256(
      ['bytes32', 'bytes32', 'bytes32'],
      [modelHash, inputHash, outputHash]
    );
    const signature = await signer.signMessage(ethers.getBytes(proofMessage));

    // Cleanup temp files
    await fs.unlink(encryptedPath).catch(() => {});
    await fs.unlink(decryptedPath).catch(() => {});

    // Update credits and log usage
    const before = creditEntry.remaining;
    creditEntry.remaining -= 1;
    creditEntry.lastSyncedAt = new Date();
    modelData.markModified('localCredits');

    modelData.apiUsageLogs.push({
      user: userAddress,
      usedAt: new Date(),
      creditsBefore: before,
      creditsUsed: 1,
      notes: `Prediction successful`,
      modelHash,
      inputHash,
      outputHash,
      signature,
    });

    await modelData.save();

    return res.json({
      prediction: JSON.parse(predictionResultRaw),
      proof: {
        modelHash,
        inputHash,
        outputHash,
        signature,
        signedBy: signer.address,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (err) {
    console.error(' Internal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
