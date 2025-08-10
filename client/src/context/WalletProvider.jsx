import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import abi from "../abi/ModelMarketplace.json";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const providerRef = useRef(null);
  const mountedRef = useRef(true);

  

  const AVALANCHE_FUJI = {
    chainId: "0xa869",
    params: {
      chainId: "0xa869",
      chainName: "Avalanche Fuji C-Chain",
      nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
      rpcUrls: ["https://avax-fuji.g.alchemy.com/v2/ie79yzS-UmQ2HfmEExa5wxVv3KZ0d1LR"],
      blockExplorerUrls: ["https://testnet.snowtrace.io"],
    },
  };

  const TARGET = import.meta.env.VITE_TARGET_CHAIN === "avaxFuji" ? AVALANCHE_FUJI : GANACHE;

  const getProvider = () => {
    if (typeof window !== "undefined") {
      if (window.ethereum && window.ethereum.isCore) {
        console.log("🔗 Detected Core Wallet");
        return new ethers.BrowserProvider(window.ethereum);
      }
      if (window.ethereum) {
        console.log("🔗 Detected MetaMask or compatible wallet");
        return new ethers.BrowserProvider(window.ethereum);
      }
    }
    throw new Error("No supported wallet found. Please install MetaMask or Core Wallet.");
  };

  const ensureCorrectChain = async () => {
    const provider = getProvider();
    const currentChainId = await provider.send("eth_chainId", []);

    if (currentChainId !== TARGET.chainId) {
      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: TARGET.chainId }]);
      } catch (switchError) {
        if (switchError.code === 4902) {
          await provider.send("wallet_addEthereumChain", [TARGET.params]);
        } else {
          throw switchError;
        }
      }
    }
  };

  const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask or Core Wallet");
    return;
  }

  try {
    const provider = getProvider();
    providerRef.current = provider;

    // STEP 1: Request account access FIRST
    const accounts = await provider.send("eth_requestAccounts", []);
    const address = accounts[0];
    setAccount(address);

    // STEP 2: Switch or add the correct chain AFTER account access
    await ensureCorrectChain();

    // STEP 3: Load contract
    const signer = await provider.getSigner();
    const contractInstance = new ethers.Contract(
      import.meta.env.VITE_CONTRACT_ADDRESS,
      abi,
      signer
    );
    setContract(contractInstance);

  } catch (error) {
    console.error("❌ Wallet connection error:", error);
    if (error.code === 4001) {
      alert("Connection request was rejected.");
    } else if (error.code === 4100) {
      alert("Approve wallet access before switching network.");
    } else {
      alert("Failed to connect: " + error.message);
    }
  }
};


  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
  };

  useEffect(() => {
    mountedRef.current = true;

    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = getProvider();
        providerRef.current = provider;

        (async () => {
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            const address = accounts[0];
            setAccount(address);

            const signer = await provider.getSigner();
            const instance = new ethers.Contract(
              import.meta.env.VITE_CONTRACT_ADDRESS,
              abi,
              signer
            );
            setContract(instance);
          }
        })();
      } catch (err) {
        console.debug("Auto-connect skipped:", err.message);
      }
    }

    const handleAccountsChanged = async (accounts) => {
      if (!mountedRef.current) return;
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        try {
          const signer = await providerRef.current.getSigner();
          const instance = new ethers.Contract(
            import.meta.env.VITE_CONTRACT_ADDRESS,
            abi,
            signer
          );
          setContract(instance);
        } catch (err) {
          console.error("Contract load failed on account change:", err);
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      mountedRef.current = false;
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  return (
    <WalletContext.Provider value={{ account, contract, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
