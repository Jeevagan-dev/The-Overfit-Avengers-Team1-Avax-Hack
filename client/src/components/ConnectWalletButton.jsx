import React from "react";
import { useWallet } from "../context/WalletProvider";
import { Wallet, LogOut } from "lucide-react";

export default function ConnectWalletButton() {
  const { account, connectWallet, disconnectWallet } = useWallet();

  return account ? (
    <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-2 shadow-sm">
      <span className="text-sm font-medium text-gray-800">
        {account.slice(0, 6)}...{account.slice(-4)}
      </span>
      <button
        onClick={disconnectWallet}
        className="text-red-600 hover:text-red-800 transition"
        title="Disconnect"
      >
        <LogOut size={18} />
      </button>
    </div>
  ) : (
    <button
      onClick={connectWallet}
      className="flex items-center gap-2  bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 rounded-lg font-medium hover:scale-105  text-white  shadow-md hover:shadow-lg transition-all duration-200"
    >
      <Wallet size={18} />
      Connect Wallet
    </button>
  );
}
