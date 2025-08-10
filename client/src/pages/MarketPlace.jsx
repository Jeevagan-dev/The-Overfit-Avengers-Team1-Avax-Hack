import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { useWallet } from "../context/WalletProvider";
import ProofVerifier from "./Verify";

export default function MarketplacePage() {
  const { contract, account, connectWallet } = useWallet();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ethInputs, setEthInputs] = useState({});
  const [selectedModel, setSelectedModel] = useState(null);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("📋 Copied to clipboard!");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      alert("❌ Failed to copy.");
    }
  };

  useEffect(() => {
    if (contract) {
      fetchModels();
    }
  }, [contract]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const count = await contract.modelCounter();
      const metadataRes = await axios.get("http://localhost:3001/api/visible-models");
      const metadata = metadataRes.data.models || [];
      const cidToMeta = Object.fromEntries(metadata.map((m) => [m.cid, m]));
      const fetched = [];

      for (let i = 0; i < count; i++) {
        const m = await contract.models(i);
        const meta = cidToMeta[m.ipfsCID];
        if (!meta) continue;

        fetched.push({
          id: i,
          owner: m.uploader,
          cid: m.ipfsCID,
          price: parseFloat(ethers.formatEther(m.creditPrice)),
          modelName: meta.modelName,
          description: meta.description,
          inputFormat: meta.inputFormat,
        });
      }

      setModels(fetched);
    } catch (err) {
      console.error("Failed to fetch models:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCredits = (avaxValue, price) => {
    const num = parseFloat(avaxValue);
    return isNaN(num) || num <= 0 ? 0 : Math.floor(num / price);
  };

  const handleEthInputChange = (id, value) => {
    setEthInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleBuy = async (id, pricePerCredit) => {
    const avaxInput = ethInputs[id];
    const creditCount = calculateCredits(avaxInput, pricePerCredit);
    if (creditCount <= 0) return alert("Please enter a valid AVAX amount.");

    try {
      const totalAvax = (creditCount * pricePerCredit).toFixed(18);
      const tx = await contract.purchaseCredits(id, BigInt(creditCount), {
        value: ethers.parseEther(totalAvax),
      });
      await tx.wait();
      alert(`✅ Purchased ${creditCount} credits!`);
      setEthInputs((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Purchase failed:", err);
      alert("❌ Transaction failed.");
    }
  };

    if (!account) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6 text-white"
        style={{
          backgroundColor: "#0e0e0e",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Wallet Required</h2>
          <button
            onClick={connectWallet}
            className="w-full  bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 rounded-lg font-medium hover:scale-105 transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen  p-6 max-w-7xl mx-auto text-white"
      style={{
        backgroundColor: "#0e0e0e",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl mt-20 font-bold">Marketplace</h2>
       
      </div>

      {loading ? (
        <p className="mt-6 text-gray-400">Loading models...</p>
      ) : models.length === 0 ? (
        <p className="mt-6 text-gray-500">No models available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {models.map((m) => (
            <div
              key={m.id}
              className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.02] hover:border-red-400/50 transition-all duration-300"
            >
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {m.modelName || `Model #${m.id}`}
                </h3>
                <p className="text-sm text-gray-400 mb-1">
                  Owner: {m.owner.slice(0, 6)}...{m.owner.slice(-4)}
                </p>
                <p className="text-sm text-gray-300 mb-2">
                  Price:{" "}
                  <span className="font-bold text-red-400">
                    {m.price} AVAX
                  </span>{" "}
                  / credit
                </p>
                {m.description && (
                  <p className="text-sm text-gray-400 mb-3">{m.description}</p>
                )}

                {Array.isArray(m.inputFormat) && m.inputFormat.length > 0 && (
                  <button
                    onClick={() => setSelectedModel(m)}
                    className="w-full text-xs px-3 py-2 bg-white/10 rounded-md border border-white/10 hover:border-red-400/50 hover:bg-white/15 transition"
                  >
                    View Input Format
                  </button>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate">CID: {m.cid}</p>
                  <button
                    onClick={() => copyText(m.cid)}
                    className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <input
                type="number"
                disabled={!account}
                placeholder="Enter AVAX"
                className="w-full mt-4 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                value={ethInputs[m.id] || ""}
                onChange={(e) => handleEthInputChange(m.id, e.target.value)}
              />

              <p className="text-xs text-gray-400 mb-2">
                You’ll get{" "}
                <strong className="text-red-400">
                  {calculateCredits(ethInputs[m.id], m.price)}
                </strong>{" "}
                credits
              </p>

              <button
                onClick={() => handleBuy(m.id, m.price)}
                disabled={!account}
                className="w-full bg-gradient-to-r from-red-500 to-red-500 text-white text-sm py-2 rounded-md hover:scale-[1.02] transition disabled:opacity-50"
              >
                Buy Credits
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedModel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-4">Input Format (Raw JSON)</h3>
            <pre className="bg-black/40 p-3 rounded-md text-xs text-gray-200 overflow-x-auto max-h-80">
              {JSON.stringify(selectedModel.inputFormat, null, 2)}
            </pre>
            <div className="flex justify-between mt-4">
              <button
                onClick={() =>
                  copyText(JSON.stringify(selectedModel.inputFormat, null, 2))
                }
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
              >
                Copy
              </button>
              <button
                onClick={() => setSelectedModel(null)}
                className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-500 rounded hover:scale-[1.02] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







 