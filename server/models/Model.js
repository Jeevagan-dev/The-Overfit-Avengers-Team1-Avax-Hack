

import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
  uploader: String,
  price: String, 
  cid: String,
  aesKey: String,
  iv: String,

  modelName: String,
  description: String,
  inputFormat: Object,
  uploadedAt: { type: Date, default: Date.now },
  fileType: String,
  originalFilename: String,

  apiKeys: [
    {
      user: String,
      key: String,
      createdAt: Date,
    },
  ],

  localCredits: [
    {
      user: String,
      fetchAtSc: Number,
      remaining: Number,
      lastSyncedAt: Date,
    },
  ],

  apiUsageLogs: [
    {
      user: String,
      usedAt: Date,
      fetchAtSc: Number,
      creditsBefore: Number,
      creditsUsed: Number,
      notes: String,

      // ✅ Proof fields
      modelHash: String,
      inputHash: String,
      outputHash: String,
      signature: String,
    },
  ],
});

export const Model = mongoose.model('Model', modelSchema);