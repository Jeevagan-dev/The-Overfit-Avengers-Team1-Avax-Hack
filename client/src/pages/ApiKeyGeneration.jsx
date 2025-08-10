import { useEffect, useState } from "react";
import { useWallet } from "../context/WalletProvider";
import axios from "axios";
import { Eye, EyeOff, Loader2, Copy } from "lucide-react";

export default function UserAPIKeyPanel() {
  const { account, contract, connectWallet } = useWallet();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState({});
  const [expanded, setExpanded] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (account && contract) fetchPurchasedModels();
  }, [account, contract]);

  const fetchPurchasedModels = async () => {
    setLoading(true);
    try {
      const modelIds = [];
      const keys = {};

      for (let i = 0; i < 5; i++) {
        try {
          const credits = await contract.getCredits(account, i);
          if (Number(credits) > 0) {
            const modelStruct = await contract.models(i);
            const hasKey = await contract.hasApiKey(i, account);

            modelIds.push({
              id: i,
              uploader: modelStruct.uploader,
              creditPrice: Number(modelStruct.creditPrice),
              ipfsCID: modelStruct.ipfsCID,
            });

            keys[i] = hasKey;
          }
        } catch {
          break;
        }
      }

      setModels(modelIds);
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setMessage({ type: "error", text: "Failed to load purchased models." });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (modelId) => {
    if (!account || !contract) {
      setMessage({ type: "error", text: "Please connect your wallet first." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await axios.post("http://localhost:3001/api/generate-api-key", {
        modelId,
        userAddress: account,
      });

      const { apiKey, error } = res.data;

      if (apiKey) {
        setApiKeys((prev) => ({ ...prev, [modelId]: true }));
        await handleViewDetails(modelId);
        setMessage({ type: "success", text: `✅ API Key generated for model #${modelId}` });
      } else {
        setMessage({ type: "error", text: `❌ Error: ${error}` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Failed to generate API key" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (modelId) => {
    setExpanded((prev) => ({ ...prev, [modelId]: { loading: true } }));
    try {
      const res = await axios.get("http://localhost:3001/api/api-key-info", {
        params: {
          modelId,
          userAddress: account,
        },
      });

      setExpanded((prev) => ({
        ...prev,
        [modelId]: {
          ...res.data,
          loading: false,
          showKey: false,
        },
      }));
    } catch (err) {
      console.error("Failed to fetch API key info:", err);
      setExpanded((prev) => ({ ...prev, [modelId]: { loading: false, error: true } }));
    }
  };

  const toggleKeyVisibility = (modelId) => {
    setExpanded((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        showKey: !prev[modelId]?.showKey,
      },
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied API Key to clipboard!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 2000);
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
  <div className="p-4 sm:p-6 max-w-7xl mx-auto text-white">
  <h1 className="text-2xl sm:text-3xl mt-20 font-semibold mb-8">
    Your Purchased Models
  </h1>

  {loading && (
    <p className="flex items-center gap-2 text-gray-400">
      <Loader2 className="animate-spin" /> Loading your models...
    </p>
  )}

  {!loading && models.length === 0 && (
    <p className="text-gray-400">No purchased models with credits found.</p>
  )}

  <ul className="space-y-6">
    {models.map((model) => (
      <li
        key={model.id}
        className="bg-gradient-to-br bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col max-w-full sm:max-w-xl">
            <p className="font-semibold text-lg">Model #{model.id + 1}</p>
            <p
              className="text-gray-400 truncate max-w-[200px] sm:max-w-xs cursor-default select-text"
              title={model.ipfsCID}
            >
              CID: {model.ipfsCID}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {apiKeys[model.id] && expanded[model.id]?.apiKey ? (
              <>
                <div className="flex items-center bg-gray-700 rounded px-3 py-1 font-mono select-all cursor-pointer max-w-full sm:max-w-none overflow-x-auto">
                  {expanded[model.id].showKey
                    ? expanded[model.id].apiKey.key
                    : "••••••••••••••••••"}
                </div>

                <button
                  onClick={() => toggleKeyVisibility(model.id)}
                  className="p-1 text-gray-300 hover:text-white transition"
                >
                  {expanded[model.id].showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                <button
                  onClick={() => copyToClipboard(expanded[model.id].apiKey.key)}
                  className="p-1 text-gray-300 hover:text-white transition"
                >
                  <Copy size={20} />
                </button>

                <button
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [model.id]: { loading: false },
                    }))
                  }
                  className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition text-sm"
                >
                  Hide Details
                </button>
              </>
            ) : apiKeys[model.id] ? (
              <button
                onClick={() => handleViewDetails(model.id)}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
              >
                View Details
              </button>
            ) : (
              <button
                onClick={() => handleGenerateKey(model.id)}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto"
                disabled={loading}
              >
                Generate API Key
              </button>
            )}
          </div>
        </div>
        {expanded[model.id] && !expanded[model.id].loading && expanded[model.id].usageLogs && (
          <section className="mt-6 bg-white/5 rounded-xl p-4 sm:p-5 border border-white/20">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Usage Details</h3>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium text-gray-300 mb-1">Local Credits</p>
                <p>
                  Remaining:{" "}
                  <span className="text-green-400">
                    {expanded[model.id].localCredits?.remaining ?? "N/A"}
                  </span>
                </p>
                <p>
                  Synced at SC:{" "}
                  <span className="text-green-400">
                    {expanded[model.id].localCredits?.fetchAtSc ?? "N/A"}
                  </span>
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-300 mb-1">Model Info</p>
                <p>Name: <span className="text-gray-200">{expanded[model.id].modelInfo?.modelName ?? "Unknown"}</span></p>
                <p>Price: <span className="text-gray-200">{expanded[model.id].modelInfo?.price ?? "N/A"}</span></p>
                <p>CID: <span className="text-gray-200 break-words">{expanded[model.id].modelInfo?.cid ?? "N/A"}</span></p>
              </div>
            </div>

            <div>
              <p className="font-medium text-gray-300 mb-2">Usage Logs</p>
              {expanded[model.id].usageLogs.length > 0 ? (
                <div className="overflow-x-auto border border-white/20 rounded">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-black sticky top-0">
                      <tr>
                        <th className="px-4 py-2">Date & Time</th>
                        <th className="px-4 py-2">Credits Used</th>
                        <th className="px-4 py-2">Notes</th>
                        <th className="px-4 py-2">Verify Authenticity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expanded[model.id].usageLogs.map((log, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-red-700" : ""}>
                          <td className="px-4 py-1">{new Date(log.usedAt).toLocaleString()}</td>
                          <td className="px-4 py-1">{log.creditsUsed}</td>
                          <td className="px-4 py-1 break-words max-w-xs">{log.notes}</td>
                          <td className="px-4 py-1">
                            <button
                              onClick={() => {
                                const copyText = `${log.modelHash},${log.inputHash},${log.outputHash},${log.signature}`;
                                navigator.clipboard.writeText(copyText)
                                  .then(() => alert("Signature data copied!"))
                                  .catch(err => console.error("Failed to copy:", err));
                              }}
                              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-blue-500"
                            >
                              Check
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="italic text-gray-400">No usage logs available.</p>
              )}
            </div>
          </section>
        )}

        {expanded[model.id]?.loading && (
          <p className="mt-4 text-gray-400 flex items-center gap-2">
            <Loader2 className="animate-spin" /> Loading details...
          </p>
        )}

        {expanded[model.id]?.error && (
          <p className="mt-4 text-red-500 font-semibold">
            Failed to load API key details.
          </p>
        )}
      </li>
    ))}
  </ul>

  {message.text && (
    <div
      className={`mt-10 p-4 rounded-lg text-center font-medium ${
        message.type === "success"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {message.text}
    </div>
  )}
</div>

  );
}
