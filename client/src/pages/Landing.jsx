import React from "react";
import { Rocket, Shield, DollarSign, CheckCircle, Upload, Layers, Cpu, BadgeCheck, GlobeLock, Lock, FileText } from "lucide-react";

const PLAN_ENUM = ["Basic", "Pro", "Elite"];
const PLAN_SPECS = [
  { gpu: "1 x NVIDIA RTX 3060", storage: "50GB SSD", description: "Entry level for small models", price: "0.02 AVAX" },
  { gpu: "2 x NVIDIA RTX 3070", storage: "100GB SSD", description: "Mid tier for medium models", price: "0.05 AVAX" },
  { gpu: "4 x NVIDIA RTX 3090", storage: "200GB SSD", description: "High end for large models", price: "0.1 AVAX" },
];

function Landing() {
  return (
    <div className="bg-gradient-to-b from-[#0f0f0f] to-black text-white">

       <div
      className="min-h-screen  p-6 w-full mx-auto text-white"
      style={{
        backgroundColor: "#0e0e0e",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <section className="w-full mx-auto px-6 pt-32 pb-20 text-center  md:pt-70">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white via-gray-200 to-red-400 bg-clip-text text-transparent tracking-tight">
          Train. Host. Predict.
        </h1>
        <h2 className="text-2xl md:text-3xl font-medium mb-8 text-gray-300">
          All on a Decentralized ML Platform
        </h2>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
          Train and rent AI models with transparent blockchain tracking, ZK-proof authenticity verification, 
          and subscription-based access to powerful GPUs — without cloud lock-in or hidden costs.
        </p>
        <button className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-semibold rounded-2xl hover:scale-105 transition-transform duration-300 shadow-2xl shadow-red-500/25">
          Start Training Now
        </button>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Key Problems We Solve</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Rocket className="w-8 h-8 text-red-400" />, problem: "Expensive & Complex AI Training", solution: "We offer scalable GPU access + frictionless uploads for datasets & code." },
            { icon: <Shield className="w-8 h-8 text-red-400" />, problem: "Model Security Risks", solution: "AES encryption + IPFS storage ensures your models remain tamper-proof." },
            { icon: <DollarSign className="w-8 h-8 text-red-400" />, problem: "Unfair Revenue Sharing", solution: "Model owners set their prices, payouts are instant via smart contracts." },
            { icon: <BadgeCheck className="w-8 h-8 text-red-400" />, problem: "Fake/Unverified Models", solution: "Zero-Knowledge Proofs verify model authenticity without revealing sensitive IP." }
          ].map((item, index) => (
            <div key={index} className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 hover:scale-105 hover:border-red-400/50 transition-all duration-300">
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-3 text-red-400">{item.problem}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{item.solution}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {[
            { step: "01", title: "Upload", description: "Upload your dataset & training code securely.", icon: <Upload className="w-8 h-8 text-red-400 mx-auto" /> },
            { step: "02", title: "Select Plan", description: "Choose Basic, Pro, or Elite with GPU/Storage tiers.", icon: <Layers className="w-8 h-8 text-red-400 mx-auto" /> },
            { step: "03", title: "Train", description: "Run training jobs on decentralized GPU infrastructure.", icon: <Cpu className="w-8 h-8 text-red-400 mx-auto" /> },
            { step: "04", title: "Verify", description: "We generate ZK-proofs to verify your model’s authenticity.", icon: <GlobeLock className="w-8 h-8 text-red-400 mx-auto" /> },
            { step: "05", title: "Deploy", description: "Monetize or use your model via API with blockchain tracking.", icon: <CheckCircle className="w-8 h-8 text-red-400 mx-auto" /> }
          ].map((item, index) => (
            <div key={index} className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 text-center hover:scale-105 hover:border-red-400/50 transition-all duration-300">
              <div className="mb-4">{item.icon}</div>
              <div className="text-xl font-bold text-red-400">{item.step}</div>
              <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-300 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLAN_ENUM.map((plan, i) => (
            <div key={i} className={`bg-white/5 border backdrop-blur-lg rounded-2xl p-8 hover:scale-105 transition-all duration-300 ${i === 1 ? "border-red-400/50 shadow-2xl shadow-red-500/20" : "border-white/10 hover:border-red-400/50"}`}>
              {i === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{plan}</h3>
                <p className="text-gray-400 text-sm mb-6">{PLAN_SPECS[i].description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-red-400">{PLAN_SPECS[i].price}</span>
                  <span className="text-gray-400 ml-2">/ month</span>
                </div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center text-sm"><CheckCircle className="w-4 h-4 text-red-400 mr-3" />{PLAN_SPECS[i].gpu}</li>
                  <li className="flex items-center text-sm"><CheckCircle className="w-4 h-4 text-red-400 mr-3" />{PLAN_SPECS[i].storage}</li>
                  <li className="flex items-center text-sm"><CheckCircle className="w-4 h-4 text-red-400 mr-3" />API access</li>
                  <li className="flex items-center text-sm"><CheckCircle className="w-4 h-4 text-red-400 mr-3" />Blockchain tracking</li>
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${i === 1 ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:scale-105" : "bg-white/10 border border-white/20 hover:border-red-400/50 hover:bg-white/15"}`}>
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
    </div>
  );
}

export default Landing;
