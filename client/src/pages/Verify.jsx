import { useState } from "react";
import {
  keccak256,
  getBytes,
  hashMessage,
  recoverAddress,
  solidityPacked,
} from "ethers";
import { CheckCircle, XCircle, Shield } from "lucide-react";

const backendAddress = "0x41D925BE2Cc235cd4f196872eEBC600231D68a4D";

export default function ProofVerifier() {
  const [input, setInput] = useState("");
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState("");

  const verifySignature = () => {
    try {
      setError("");
      const [modelHash, inputHash, outputHash, signature] = input
        .split(",")
        .map((v) => v.trim());

      if (!modelHash || !inputHash || !outputHash || !signature) {
        setError("Please enter exactly four comma-separated values.");
        return;
      }

      const packed = solidityPacked(
        ["bytes32", "bytes32", "bytes32"],
        [modelHash, inputHash, outputHash]
      );

      const packedHash = keccak256(packed);
      const ethHashed = hashMessage(getBytes(packedHash));
      const recovered = recoverAddress(ethHashed, signature);

      const valid = recovered.toLowerCase() === backendAddress.toLowerCase();
      setIsValid(valid);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Invalid data format or signature.");
      setIsValid(false);
    }
  };

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
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-7 h-7 text-red-500" />
          <h2 className="text-3xl font-semibold">Verify Prediction Signature</h2>
        </div>

        <p className="text-gray-300 text-sm">
          Enter <span className="font-medium text-white">modelHash</span>,{" "}
          <span className="font-medium text-white">inputHash</span>,{" "}
          <span className="font-medium text-white">outputHash</span>, and{" "}
          <span className="font-medium text-white">signature</span> separated by commas.
        </p>

        <textarea
          placeholder='0xModelHash, 0xInputHash, 0xOutputHash, 0xSignature'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={4}
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={verifySignature}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white text-sm py-2 rounded-md hover:scale-[1.02] transition"
        >
          Verify Signature
        </button>

        {isValid !== null && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              isValid
                ? "bg-green-500/20 text-green-300 border border-green-400/40"
                : "bg-red-500/20 text-red-300 border border-red-400/40"
            }`}
          >
            {isValid ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
            <span className="font-medium">
              {isValid
                ? " Valid Signature (Backend Verified)"
                : " Invalid Signature"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
