import express from "express";
import { Model } from "../models/Model.js";
import { ethers } from "ethers";
import contractABI from "../abi/ModelMarketplace.json" with { type: "json" };

const router = express.Router();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PROVIDER_URL = process.env.RPC_URL;

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

router.get("/", async (req, res) => {
  try {
    const count = await contract.modelCounter();
    const blockchainCIDs = [];

    for (let i = 0; i < count; i++) {
      const m = await contract.models(i);
      blockchainCIDs.push(m.ipfsCID);
    }

    const models = await Model.find({ cid: { $in: blockchainCIDs } })
      .select("modelName description inputFormat cid")
      .lean();

    return res.json({ success: true, models });
  } catch (err) {
    console.error("Error fetching visible models:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
