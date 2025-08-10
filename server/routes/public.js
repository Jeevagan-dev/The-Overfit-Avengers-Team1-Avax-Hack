import express from 'express';
import { getAllModelIds, getModelDetails } from '../lib/web3.js';

const router = express.Router();

router.get('/models', async (req, res) => {
  try {
    const ids = await getAllModelIds();
    const all = await Promise.all(ids.map(id => getModelDetails(id)));
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch models' });
  }
});

export default router;
