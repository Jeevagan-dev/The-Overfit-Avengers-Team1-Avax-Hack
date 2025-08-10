import { useState } from "react";
import { ethers } from "ethers";
import { uploadModel } from "../api";
import { useWallet } from "../context/WalletProvider";

export default function UploadPage() {
  const { account, contract, connectWallet } = useWallet();

  const [model, setModel] = useState(null);
  const [price, setPrice] = useState("");
  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!account) return alert("Connect wallet first");
    if (!contract) return alert("Contract not loaded yet.");
    if (!model || !price || !modelName || !description || !inputFormat) {
      return alert("Please fill out all fields and select a model file.");
    }

    try {
      JSON.parse(inputFormat);
    } catch {
      return alert("Input Format must be valid JSON.");
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await uploadModel(model, price, account, modelName, description, inputFormat);
      const cid = res.cid;
      if (!cid) throw new Error("Failed to get CID from backend");

      setMessage(`Uploading to blockchain...`);

      const tx = await contract.uploadModel(
        ethers.parseEther(price),
        cid,
        { value: ethers.parseEther("0.1") }
      );
      await tx.wait();

      setMessage(`✅ Model uploaded and registered on-chain with CID: ${cid}`);
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed: " + err.message);
    } finally {
      setLoading(false);
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
      className="min-h-screen p-6 mt-20 max-w-3xl mx-auto text-white"
      style={{
        backgroundColor: "#0e0e0e",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-lg rounded-2xl p-6 space-y-4 shadow-lg">
        <h2 className="text-3xl font-semibold mb-4">Upload AI Model</h2>

        <input
          type="file"
          onChange={(e) => setModel(e.target.files[0])}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <input
          type="text"
          placeholder="Model Name"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
        />

        <textarea
          placeholder='Input Format (e.g. {"prompt": "string"})'
          value={inputFormat}
          onChange={(e) => setInputFormat(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm resize-none font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={2}
        />

        <input
          type="text"
          placeholder="Price in AVAX"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className={`w-full bg-gradient-to-r from-red-500 to-red-500 text-white text-sm py-2 rounded-md hover:scale-[1.02] transition disabled:opacity-50`}
        >
          {loading ? "Uploading..." : "Upload Model"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-300">{message}</p>
        )}
      </div>
    </div>
  );
}
