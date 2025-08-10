
import express from 'express';
import crypto from 'crypto';
import { Model } from '../models/Model.js';
import { connectDB } from '../lib/db.js';
import { ethers } from 'ethers';
import contractABI from '../abi/ModelMarketplace.json' with { type: "json" };

const router = express.Router();

const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.BACKEND_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

if (!contractAddress || !privateKey || !process.env.RPC_URL) {
  throw new Error(" Missing Web3 environment variables");
}

router.post('/generate-api-key', async (req, res) => {
  try {
    await connectDB();

    const { modelId, userAddress } = req.body;
    console.log('👉 Received Body:', req.body);

   if (typeof modelId !== 'number' || !userAddress)  {
      return res.status(400).json({ error: 'Missing modelId or userAddress' });
    }

    const alreadyGenerated = await contract.hasApiKey(modelId, userAddress);
    if (alreadyGenerated) {
      return res.status(400).json({ error: 'API key already generated for this model and user' });
    }

    const credits = await contract.getCredits(userAddress, modelId);
    const numericCredits = Number(credits);
    if (numericCredits <= 0) {
      return res.status(403).json({ error: 'No credits available to generate API key' });
    }

    const secret = process.env.API_SECRET_KEY;
    const payload = `${modelId}-${userAddress}-${Date.now()}`;
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const modelData = await contract.models(modelId);
    const cid = modelData[2];

   
    await Model.updateOne(
      { cid },
      {
        $push: {
          apiKeys: {
            user: userAddress,
            key: hmac,
            createdAt: new Date(),
          },
          localCredits: {
            user: userAddress,
            remaining: numericCredits,
            fetchAtSc: numericCredits, 
            lastSyncedAt: new Date(),
          },
          apiUsageLogs: {
            user: userAddress,
            usedAt: new Date(),
            creditsBefore: numericCredits,
            creditsUsed: 0,
            notes: 'API key generated - initial credit sync',
          },
        },
      }
    );

    const tx = await contract.setApiKeyGenerated(modelId, userAddress);
    await tx.wait();

    return res.json({ success: true, apiKey: hmac });
  } catch (err) {
    console.error('❌ API key generation failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/api-key-info', async (req, res) => {
  try {
    await connectDB();

    const { modelId, userAddress } = req.query;

    if (!modelId || !userAddress) {
      return res.status(400).json({ error: 'Missing modelId or userAddress' });
    }


    const modelData = await contract.models(modelId);
    const cid = modelData[2];

    const model = await Model.findOne({ cid }).lean();

    if (!model) {
      return res.status(404).json({ error: 'Model not found in DB' });
    }

    const apiKeyData = model.apiKeys?.find(k => k.user.toLowerCase() === userAddress.toLowerCase()) || null;
    const creditData = model.localCredits?.find(c => c.user.toLowerCase() === userAddress.toLowerCase()) || null;
    const usageLogs = model.apiUsageLogs?.filter(log => log.user.toLowerCase() === userAddress.toLowerCase()) || [];

    const essentialInfo = {
      modelName: model.modelName,
      price: model.price,
      inputFormat: model.inputFormat,
      cid: model.cid,
      
    };

    const check = {
      success: true,
      modelInfo: essentialInfo,
      apiKey: apiKeyData,
      localCredits: creditData,
      usageLogs,
    }
console.log(check)
    return res.json({
      success: true,
      modelInfo: essentialInfo,
      apiKey: apiKeyData,
      localCredits: creditData,
      usageLogs,
    });
  } catch (err) {
    console.error(' Failed to fetch API key info:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;

// // routes/apikey.js
// import express from 'express';
// import crypto from 'crypto';
// import { Model } from '../models/Model.js';
// import { connectDB } from '../lib/db.js';
// import { ethers } from 'ethers';
// import contractABI from '../abi/ModelMarketplace.json' with { type: "json" };

// const router = express.Router();

// const contractAddress = process.env.CONTRACT_ADDRESS;
// const privateKey = process.env.BACKEND_PRIVATE_KEY;
// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
// const wallet = new ethers.Wallet(privateKey, provider);
// const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// if (!contractAddress || !privateKey || !process.env.RPC_URL) {
//   throw new Error("❌ Missing Web3 environment variables");
// }

// async function getModelDataCached(modelId) {
//   return Model.findOne({ modelId }).lean();
// }

// /**
//  * POST /generate-api-key
//  */
// router.post('/generate-api-key', async (req, res) => {
//   try {
//     await connectDB();
//     const { modelId, userAddress } = req.body;

//     if (typeof modelId !== 'number' || !userAddress) {
//       return res.status(400).json({ error: 'Missing modelId or userAddress' });
//     }

//     const [alreadyGenerated, credits, modelData] = await Promise.all([
//       contract.hasApiKey(modelId, userAddress),
//       contract.getCredits(userAddress, modelId),
//       getModelDataCached(modelId)
//     ]);

//     if (alreadyGenerated) {
//       return res.status(400).json({ error: 'API key already generated' });
//     }
//     const numericCredits = Number(credits);
//     if (numericCredits <= 0) {
//       return res.status(403).json({ error: 'No credits available' });
//     }

//     const secret = process.env.API_SECRET_KEY;
//     const payload = `${modelId}-${userAddress}-${Date.now()}`;
//     const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

//     await Model.updateOne(
//       { cid: modelData?.cid },
//       {
//         $push: {
//           apiKeys: { user: userAddress, key: hmac, createdAt: new Date() },
//           localCredits: {
//             user: userAddress,
//             remaining: numericCredits,
//             fetchAtSc: numericCredits,
//             lastSyncedAt: new Date(),
//           },
//           apiUsageLogs: {
//             user: userAddress,
//             usedAt: new Date(),
//             creditsBefore: numericCredits,
//             creditsUsed: 0,
//             notes: 'API key generated - initial sync',
//           },
//         },
//       }
//     );

//     const tx = await contract.setApiKeyGenerated(modelId, userAddress);
//     await tx.wait();

//     res.json({ success: true, apiKey: hmac });
//   } catch (err) {
//     console.error('❌ API key generation failed:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// /**
//  * GET /api-key-info
//  * - Returns local data immediately
//  * - Fetches blockchain credits in background
//  */
// router.get('/api-key-info', async (req, res) => {
//   try {
//     await connectDB();
//     const { modelId, userAddress } = req.query;

//     if (!modelId || !userAddress) {
//       return res.status(400).json({ error: 'Missing modelId or userAddress' });
//     }

//     const localModelData = await getModelDataCached(Number(modelId));
//     if (!localModelData) {
//       return res.status(404).json({ error: 'Model not found in DB' });
//     }

//     const apiKeyData = localModelData.apiKeys?.find(
//       k => k.user.toLowerCase() === userAddress.toLowerCase()
//     ) || null;
//     const usageLogs = localModelData.apiUsageLogs?.filter(
//       log => log.user.toLowerCase() === userAddress.toLowerCase()
//     ) || [];

//     // Send immediate response from local DB
//     res.json({
//       success: true,
//       modelInfo: {
//         modelName: localModelData.modelName,
//         price: localModelData.price,
//         inputFormat: localModelData.inputFormat,
//         cid: localModelData.cid,
//       },
//       apiKey: apiKeyData,
//       localCredits: localModelData.localCredits?.find(
//         c => c.user.toLowerCase() === userAddress.toLowerCase()
//       ) || null,
//       usageLogs,
//       onChainCredits: null, // will be fetched async
//       freshCreditsUpdating: true
//     });

//     // Fetch credits from chain in background and update DB
//     contract.getCredits(userAddress, Number(modelId))
//       .then(async credits => {
//         const numericCredits = Number(credits);
//         await Model.updateOne(
//           { modelId: Number(modelId), "localCredits.user": userAddress },
//           {
//             $set: {
//               "localCredits.$.remaining": numericCredits,
//               "localCredits.$.lastSyncedAt": new Date()
//             }
//           }
//         );
//         console.log(`✅ Credits updated in DB for ${userAddress}: ${numericCredits}`);
//       })
//       .catch(err => {
//         console.error('⚠️ Background credit fetch failed:', err);
//       });

//   } catch (err) {
//     console.error('❌ Failed to fetch API key info:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// export default router;
