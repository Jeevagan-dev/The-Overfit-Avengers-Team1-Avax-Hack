import React, { useState } from "react";
import { Link } from "react-router-dom";
import ConnectWalletButton from "./ConnectWalletButton";
import { Menu, X } from "lucide-react";
import { useWallet } from "../context/WalletProvider";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { account } = useWallet();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const NavLinks = () => (
    <>
      {account && (
        <>
          <Link
            to="/dashboard"
            className="text-sm font-medium hover:text-red-500 transition"
            onClick={closeMenu}
          >
            Dashboard
          </Link>
          <Link
            to="/train"
            className="text-sm font-medium hover:text-red-500 transition"
            onClick={closeMenu}
          >
            Train Model
          </Link>
        </>
      )}
      <Link
        to="/marketplace"
        className="text-sm font-medium hover:text-red-500 transition"
        onClick={closeMenu}
      >
        Marketplace
      </Link>
      {account && (
        <>
          <Link
            to="/upload"
            className="text-sm font-medium hover:text-red-500 transition"
            onClick={closeMenu}
          >
            Upload Model
          </Link>
          <Link
            to="/api-keys"
            className="text-sm font-medium hover:text-red-500 transition"
            onClick={closeMenu}
          >
            API Keys
          </Link>
          <Link
            to="/verify"
            className="text-sm font-medium hover:text-red-500 transition"
            onClick={closeMenu}
          >
            Verify
          </Link>
        </>
      )}
      <ConnectWalletButton />
    </>
  );

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] md:w-[85%] z-50">
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 px-6 py-3 rounded-2xl shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex justify-center items-center gap-2">
            <img src="./logo.png" alt="Marketplace Logo" className="h-8" />
            <h1 className="font-extrabold">Model Hub</h1>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavLinks />
          </div>

          <button
            onClick={toggleMenu}
            className="md:hidden text-white hover:text-red-400 transition"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-3 flex flex-col gap-3 px-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 shadow-inner">
            <NavLinks />
          </div>
        )}
      </div>
    </nav>
  );
}
