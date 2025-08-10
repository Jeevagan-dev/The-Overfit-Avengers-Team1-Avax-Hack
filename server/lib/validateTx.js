import { ethers } from 'ethers';
import CONTRACT_ABI from './abi.js'; 
import { CONTRACT_ADDRESS, RPC_URL } from './config.js';

export async function validateRegisterTx(txHash, expectedModelId, expectedUploader, expectedCID, expectedCreditPrice) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const tx = await provider.getTransactionReceipt(txHash);

  if (!tx || tx.status !== 1) throw new Error('Transaction failed or not found');

  const iface = new ethers.Interface(CONTRACT_ABI);
  for (const log of tx.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === 'ModelRegistered') {
        const { modelId, uploader, cid, creditPrice } = parsed.args;
        if (
          modelId === expectedModelId &&
          uploader.toLowerCase() === expectedUploader.toLowerCase() &&
          cid === expectedCID &&
          creditPrice.toString() === expectedCreditPrice.toString()
        ) {
          return true;
        } else {
          throw new Error('Mismatch in registered values');
        }
      }
    } catch (_) {
      continue;
    }
  }

  throw new Error('No ModelRegistered event found in transaction logs');
}
