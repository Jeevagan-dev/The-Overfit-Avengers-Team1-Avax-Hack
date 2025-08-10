import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletProvider';
import { Wallet, Trophy ,MoveDiagonal } from 'lucide-react';
import ProofVerifier from '../pages/Verify';

const Dashboard = () => {
  const { account, contract ,connectWallet } = useWallet();
  const [earnings, setEarnings] = useState(0);
  const [models, setModels] = useState([]);
  const [topModels, setTopModels] = useState([]);
  const [uniqueTopModels, setUniqueTopModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contract && account) {
      loadDashboard();
    }
  }, [contract, account]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const totalEarnings = await contract.getUploaderEarnings(account);
      setEarnings(Number(totalEarnings));

      const topIds = await contract.getTop10Models();
      const rawTopData = [];

      for (let i = 0; i < topIds.length; i++) {
        const id = Number(topIds[i]);
        const stats = await contract.getModelStats(id);
        rawTopData.push({
          id,
          creditsSold: Number(stats[3]),
          ipfsCID: stats[2],
        });
      }

      const topMap = new Map();
      rawTopData.forEach((model) => {
        if (!topMap.has(model.id)) {
          topMap.set(model.id, model);
        }
      });
      const unique = Array.from(topMap.values()).sort(
        (a, b) => b.creditsSold - a.creditsSold
      );

      setUniqueTopModels(unique);
      setTopModels(unique);
      const modelList = [];
      for (let i = 0; i < 2; i++) {
        try {
          const stats = await contract.getModelStats(i);
          if (stats[0]?.toLowerCase() === account.toLowerCase()) {
            modelList.push({
              id: i,
              ipfsCID: stats[2],
              creditPrice: Number(stats[1]),
              creditsSold: Number(stats[3]),
              earnings: Number(stats[4]),
            });
          }
        } catch {
          break;
        }
      }
      setModels(modelList);
    } catch (err) {
      console.error('Failed to load dashboard', err);
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
 

    <div className="p-6 max-w-7xl mx-auto text-white">
  <h1 className="text-3xl  font-semibold mt-20 mb-6">Model Owner Dashboard</h1>



  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 flex items-center space-x-4 shadow-lg rounded-2xl p-5 hover:shadow-green-500/30 transition">
      <Wallet className="text-3xl text-green-400" />
      <div>
        <h2 className="text-lg font-medium">Total Earnings</h2>
        <p className="text-2xl mt-2 font-bold">{(earnings / 1e18).toFixed(4)} AVAX</p>
      </div>
    </div>

    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 flex items-center space-x-4 shadow-lg rounded-2xl p-5 hover:shadow-blue-500/30 transition">
      <MoveDiagonal className="text-3xl text-blue-400" />
      <div>
        <h2 className="text-lg font-medium">Your Models</h2>
        <p className="text-2xl mt-2 font-bold">{models.length}</p>
      </div>
    </div>

    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 flex items-center space-x-4 shadow-lg rounded-2xl p-5 hover:shadow-yellow-500/30 transition">
      <Trophy className="text-3xl text-yellow-400" />
      <div>
        <h2 className="text-lg font-medium">Top 10 Leaderboard</h2>
        <p className="text-2xl mt-2 font-bold">
          #10 - {uniqueTopModels[1]?.creditsSold || 0} Credits
        </p>
      </div>
    </div>
  </div>

  <div className="mb-10">
    <h2 className="text-2xl font-semibold mb-4">Your Uploaded Models</h2>
    <div className="overflow-auto rounded-2xl border border-gray-700 bg-black/50 backdrop-blur-sm">
  <table className="min-w-full text-left">
    <thead className="bg-gradient-to-r from-gray-900/30 to-black/30 border-b border-gray-700">
      <tr>
        <th className="px-6 py-4 text-sm font-semibold text-red-100 tracking-wide">Model ID</th>
        <th className="px-6 py-4 text-sm font-semibold text-red-100 tracking-wide">IPFS CID</th>
        <th className="px-6 py-4 text-sm font-semibold text-red-100 tracking-wide">Price</th>
        <th className="px-6 py-4 text-sm font-semibold text-red-100 tracking-wide">Credits Sold</th>
        <th className="px-6 py-4 text-sm font-semibold text-red-100 tracking-wide">Earnings</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-800">
      {models.map((model, idx) => (
        <tr 
          key={idx} 
          className="group hover:bg-gradient-to-r hover:from-red-900/10 hover:to-transparent transition-all duration-300 hover:shadow-lg hover:shadow-red-500/5"
        >
          <td className="px-6 py-4 text-gray-200 font-medium">
            <span className="bg-red-500/10 px-3 py-1 rounded-full text-sm border border-red-500/20">
              {model.id}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="max-w-xs truncate text-gray-300 font-mono text-sm bg-black/30 px-3 py-1 rounded-lg border border-red-500/10" title={model.ipfsCID}>
              {model.ipfsCID}
            </div>
          </td>
          <td className="px-6 py-4 text-gray-200 font-medium">
            <span className="text-red-400">
              {model.creditPrice / 1e18}
            </span>
          </td>
          <td className="px-6 py-4 text-gray-200 font-medium">
            <span className="bg-gray-800/50 px-3 py-1 rounded-full text-sm border border-gray-600/30">
              {model.creditsSold}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-bold text-lg bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                {(model.earnings / 1e18).toFixed(4)} AVAX
              </span>
            </div>
          </td>
        </tr>
      ))}
      {!models.length && !loading && (
        <tr>
          <td className="px-6 py-12 text-center" colSpan="5">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-black-500/10 border-2 border-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8a2 2 0 00-2-2H9a2 2 0 00-2 2v1h10V5z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-400 font-medium">No models found</p>
                <p className="text-gray-500 text-sm mt-1">Upload your first model to get started</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

  </div>

  <div>
    <h2 className="text-2xl font-semibold mb-4">Top 10 Models Leaderboard</h2>



    <div className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br bg-black backdrop-blur-sm">
  <table className="min-w-full">
    <thead>
      <tr className="border-b border-white/20">
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Rank
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Model ID
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
          IPFS CID
        </th>
        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Credits Sold
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-white/20">
      {topModels.map((model, index) => (
        <tr 
          key={index} 
          className="group  hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent transition-all duration-200 ease-in-out"
        >
          <td className="px-6 py-4">
            <div className="flex items-center">
              <span className={`
                inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' : 
                  index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' :
                  index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white' :
                  'bg-white/10 text-gray-300'}
              `}>
                {index + 1}
              </span>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
              {model.id}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <code className="px-3 py-1 text-xs bg-white/10 rounded-lg border border-white/10 text-gray-300 font-mono truncate max-w-xs">
                {model.ipfsCID}
              </code>
              <button 
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-white/10 rounded"
                onClick={() => navigator.clipboard.writeText(model.ipfsCID)}
                title="Copy IPFS CID"
              >
                <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-green-400">
                {model.creditsSold.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">credits</span>
            </div>
          </td>
        </tr>
      ))}
      {!topModels.length && !loading && (
        <tr>
          <td className="px-6 py-12 text-center" colSpan="4">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div className="text-gray-400">
                <p className="font-medium">No models found</p>
                <p className="text-sm text-gray-500">Check back later for updated rankings</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

  </div>
</div>



 
  );
};

export default Dashboard;
