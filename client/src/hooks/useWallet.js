import { useState } from "react";
import { ethers } from "ethers";
import abi from "../abi/ModelMarketplace.json";

export default function useWallet() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not installed");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);

      const contractInstance = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        abi,
        signer
      );
      setContract(contractInstance);
    } catch (error) {
      console.error(error);
    }
  };

  return { account, contract, connectWallet };
}
