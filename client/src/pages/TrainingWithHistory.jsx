import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { ethers ,formatEther,JsonRpcProvider } from "ethers";
import { useWallet } from "../context/WalletProvider";
import {
  Brain,
  Upload,
  Play,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Wallet,
} from "lucide-react";

const PLAN_ENUM = ["Basic", "Pro", "Elite"];
const PLAN_SPECS = [
  { gpu: "1 x NVIDIA RTX 3060", storage: "50GB SSD", description: "Entry level for small models" },
  { gpu: "2 x NVIDIA RTX 3070", storage: "100GB SSD", description: "Mid tier for medium models" },
  { gpu: "4 x NVIDIA RTX 3090", storage: "200GB SSD", description: "High end for large models" },
];

const WS_URL = "ws://localhost:8000";
const API_URL = "http://localhost:8000";

export default function TrainingTabs() {
  const { account, contract, connectWallet } = useWallet();

  const [activeTab, setActiveTab] = useState("subscription");
  const [dataset, setDataset] = useState(null);
  const [code, setCode] = useState("# Write your training code here");
  const [logs, setLogs] = useState("");
  const [modelReady, setModelReady] = useState(false);

  const [active, setActive] = useState(false);
  const [plan, setPlan] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [remainingDays, setRemainingDays] = useState(0);
  const [loadingSub, setLoadingSub] = useState(true);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);

  const [planPrices, setPlanPrices] = useState([null, null, null]); 
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchasePlanId, setPurchasePlanId] = useState(null);

  const logRef = useRef(null);

  useEffect(() => {
    if (!account || !contract) return;
    const fetchSub = async () => {
      try {
        setLoadingSub(true);
        const isActive = await contract.isActive(account);
        const [planId, expiryTs] = await contract.getSubscription(account);
        const remDays = await contract.remainingDays(account);

        setActive(isActive);
        setPlan(planId.toString());
        setExpiry(new Date(Number(expiryTs) * 1000).toLocaleString());
        setRemainingDays(remDays.toString());
      } catch (err) {
        console.error("Error fetching subscription:", err);
      } finally {
        setLoadingSub(false);
      }
    };
    fetchSub();
  }, [account, contract]);



useEffect(() => {
  if (!account || !contract) return;

  let isMounted = true;

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);

      const rpcProvider = new JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
      const contractRead = contract.connect(rpcProvider);

      const filter = contractRead.filters.Subscribed();
      const latest = await rpcProvider.getBlockNumber();
      const fromBlock = Math.max(latest - 50000, 0);

      const CHUNK_SIZE = 2000; 
      let events = [];

      console.log(`Fetching history for ${account}...`);
      for (let start = fromBlock; start <= latest; start += CHUNK_SIZE) {
        const end = Math.min(start + CHUNK_SIZE - 1, latest);
        console.log(`Fetching from block ${start} to ${end}...`);
        const chunkEvents = await contractRead.queryFilter(filter, start, end);
        events = events.concat(chunkEvents);
        await new Promise(res => setTimeout(res, 150)); 
      }

      if (!isMounted) return;

      console.log(`Fetched ${events.length} raw events`);

      const parsed = events
        .filter(ev => ev.args.user.toLowerCase() === account.toLowerCase())
        .map(ev => ({
          plan: PLAN_ENUM[Number(ev.args.plan)],
          expiry: new Date(Number(ev.args.expiry) * 1000).toLocaleString(),
          tx: ev.transactionHash,
        }));

      setHistory(parsed.reverse());
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      if (isMounted) setLoadingHistory(false);
    }
  };

  fetchHistory();

  const listener = (user, plan, expiry, event) => {
    if (user.toLowerCase() === account.toLowerCase()) {
      setHistory(prev => [
        {
          plan: PLAN_ENUM[Number(plan)],
          expiry: new Date(Number(expiry) * 1000).toLocaleString(),
          tx: event.transactionHash,
        },
        ...prev,
      ]);
    }
  };

  contract.on("Subscribed", listener);

  return () => {
    isMounted = false;
    contract.off("Subscribed", listener);
  };
}, [account, contract]);



  useEffect(() => {
    if (!contract) return;
    const fetchPrices = async () => {
      try {
        const prices = await Promise.all([
          contract.planPrices(0),
          contract.planPrices(1),
          contract.planPrices(2),

        
        ]);

        console.log(prices)
        setPlanPrices(prices.map((p) => formatEther(p)));
      } catch (err) {
        console.error("Error fetching plan prices:", err);
      }
    };
    fetchPrices();
  }, [contract]);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => console.log("Connected to training logs WebSocket.");
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onmessage = (event) => {
      setLogs((prev) => prev + event.data + "\n");
      if (event.data.includes("Training process exited")) {
        setModelReady(true);
        setTraining(false);
      }
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const handleUpload = async () => {
    if (!dataset) return alert("Please upload a dataset file.");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("dataset", dataset);
      const blob = new Blob([code || ""], { type: "text/plain" });
      formData.append("code", blob, "train.py");

      await axios.post(`${API_URL}/upload`, formData);
      alert("Files uploaded successfully");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  const handleTrain = async () => {
    setLogs("");
    setModelReady(false);
    setTraining(true);
    try {
      await axios.post(`${API_URL}/train`);
    } catch (err) {
      console.error("Training failed:", err);
      alert("Training failed. Check console for details.");
      setTraining(false);
    }
  };

  const handlePurchasePlan = async (planId) => {
    if (!contract || !account) return alert("Connect your wallet first");

    try {
      setPurchaseLoading(true);
      setPurchasePlanId(planId);

      const priceBigNum = await contract.planPrices(planId);
      const tx = await contract.subscribe(planId, { value: priceBigNum });
      await tx.wait();

      alert(`Successfully purchased ${PLAN_ENUM[planId]} plan!`);

      setLoadingSub(true);
      const isActiveNow = await contract.isActive(account);
      const [planIdNew, expiryTs] = await contract.getSubscription(account);
      const remDays = await contract.remainingDays(account);
      setActive(isActiveNow);
      setPlan(planIdNew.toString());
      setExpiry(new Date(Number(expiryTs) * 1000).toLocaleString());
      setRemainingDays(remDays.toString());
      setLoadingSub(false);

      setPurchaseLoading(false);
      setPurchasePlanId(null);
      setActiveTab("subscription");
    } catch (err) {
      console.error(err);
      alert("Purchase failed: " + (err?.reason || err?.message));
      setPurchaseLoading(false);
      setPurchasePlanId(null);
    }
  };

  return (
    <div
      className="min-h-screen p-6 max-w-7xl mx-auto text-white"
      style={{
        backgroundColor: "#0e0e0e",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="flex items-center justify-between mb-6 mt-20">
        <div className="flex items-center gap-2">
    
          <h2 className="text-3xl font-bold">Model Trainer</h2>
        </div>
        {!account && (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 rounded-lg font-medium hover:scale-105 transition"
          >
            <Wallet className="w-5 h-5" /> Connect Wallet
          </button>
        )}
      </div>

      <div className="flex space-x-2 border-b border-white/10 mb-6">
        {[
          { id: "subscription", label: "Subscription" },
          { id: "history", label: "History" },
          { id: "training", label: "Training" },
          { id: "purchase", label: "Purchase Plan" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg transition ${
              activeTab === tab.id
                ? "bg-red-500 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        {activeTab === "subscription" && (
          loadingSub ? (
            <p className="text-gray-400 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Checking subscription status...
            </p>
          ) : active ? (
            <>
              <p className="flex items-center gap-2 text-green-400 font-semibold">
                <CheckCircle className="w-5 h-5" /> Active
              </p>
              <p>Plan: {PLAN_ENUM[Number(plan)]}</p>
              <p>Expiry: {expiry}</p>
              <p>Remaining Days: {remainingDays}</p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-red-400 font-semibold">
              <XCircle className="w-5 h-5" /> No active subscription — Please purchase a plan below.
            </p>
          )
        )}
{console.log(history)}
        {activeTab === "history" && (
          loadingHistory ? (
            <p className="text-gray-400">Loading history...</p>
          ) : history.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-white/10">
                  <th className="border border-white/10 p-2">Plan</th>
                  <th className="border border-white/10 p-2">Expiry</th>
                  <th className="border border-white/10 p-2">Tx</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr key={idx}>
                    <td className="border border-white/10 p-2">{h.plan}</td>
                    <td className="border border-white/10 p-2">{h.expiry}</td>
                    <td className="border border-white/10 p-2">
                      <a
                        href={`https://snowtrace.io/tx/${h.tx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No past subscriptions found.</p>
          )
        )}

        {activeTab === "training" && (

                   
          <div className="space-y-6">

               {modelReady && active && (
              <button
                onClick={() => window.open("http://localhost:8000/download")}
                className="bg-purple-500 text-white px-4 py-2 rounded"
              >
                ⬇️ Download Model
              </button>
            )}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <FileText className="w-5 h-5" /> Upload Dataset
              </label>
              <input
                type="file"
                onChange={(e) => setDataset(e.target.files[0])}
                className="block w-full bg-black/40 border border-white/10 rounded-md px-3 py-2"
                disabled={!active || uploading}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <FileText className="w-5 h-5" /> Training Code
              </label>
              <Editor
                height="400px"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  readOnly: !active,
                }}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={!active || uploading}
                className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                  active
                    ? uploading
                      ? "bg-gray-500 cursor-wait"
                      : "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                <Upload className="w-5 h-5" /> {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={handleTrain}
                disabled={!active || training}
                className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                  active
                    ? training
                      ? "bg-gray-500 cursor-wait"
                      : "bg-green-500 hover:bg-green-600"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                <Play className="w-5 h-5" /> {training ? "Training..." : "Train"}
              </button>

            </div>

            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <FileText className="w-5 h-5" /> Logs
              </label>
              <textarea
                ref={logRef}
                className="w-full border border-white/10 rounded p-2 h-64 font-mono bg-black/40 resize-none text-sm"
                readOnly
                value={logs}
              />
            </div>
          </div>
        )}

        {activeTab === "purchase" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAN_ENUM.map((pName, idx) => (
              <div
                key={idx}
                className="bg-black/40 border border-white/20 rounded-lg p-6 flex flex-col justify-between"
              >
                <h3 className="text-2xl font-bold mb-2 text-red-400">{pName}</h3>
                <p className="mb-2 font-semibold">Duration: 30 days</p>
                <p className="mb-1">
                  <strong>GPU:</strong> {PLAN_SPECS[idx].gpu}
                </p>
                <p className="mb-1">
                  <strong>Storage:</strong> {PLAN_SPECS[idx].storage}
                </p>
                <p className="mb-2 text-gray-300 italic">{PLAN_SPECS[idx].description}</p>
                <p className="mb-4 font-semibold text-xl">
                  Price:{" "}
                  {planPrices[idx] !== null
                    ? `${planPrices[idx]} AVAX`
                    : "Loading..."}
                </p>
                <button
                  disabled={
                    purchaseLoading && purchasePlanId === idx
                      ? true
                      : false || !account
                  }
                  onClick={() => handlePurchasePlan(idx)}
                  className={`w-full py-2 rounded font-semibold transition ${
                    purchaseLoading && purchasePlanId === idx
                      ? "bg-gray-600 cursor-wait"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {purchaseLoading && purchasePlanId === idx
                    ? "Purchasing..."
                    : "Purchase"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
