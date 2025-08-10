import { ethers } from 'ethers';
import contractABI from './abi.json' assert { type: 'json' };

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);

export const readContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

export const writeContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  contractABI,
  new ethers.Wallet(BACKEND_PRIVATE_KEY, provider)
);
