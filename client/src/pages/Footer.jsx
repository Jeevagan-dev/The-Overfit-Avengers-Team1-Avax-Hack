import React from "react";
import { Twitter, Github, Linkedin, Mail, Cpu } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 ">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        <div>
          <div className="flex items-center gap-2 mb-4">

            <span className="text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-red-400 bg-clip-text text-transparent">
              <img src="./logo.png" alt="model hub" className="w-10 h-10 inline" /> Model Hub
            </span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Train, host, and monetize AI models on a secure, decentralized ML platform — powered by blockchain & ZK-proofs.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Product</h3>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="#features" className="hover:text-red-400 transition">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-red-400 transition">How It Works</a></li>
            <li><a href="#plans" className="hover:text-red-400 transition">Pricing</a></li>
            <li><a href="#" className="hover:text-red-400 transition">Docs</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-red-400 transition">About Us</a></li>
            <li><a href="#" className="hover:text-red-400 transition">Careers</a></li>
            <li><a href="#" className="hover:text-red-400 transition">Partners</a></li>
            <li><a href="#" className="hover:text-red-400 transition">Blog</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Connect</h3>
          <div className="flex gap-4 mb-6">
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 transition">
              <Twitter className="w-5 h-5 text-gray-300" />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 transition">
              <Github className="w-5 h-5 text-gray-300" />
            </a>
            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 transition">
              <Linkedin className="w-5 h-5 text-gray-300" />
            </a>
            <a href="mailto:support@decentraml.com" className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 transition">
              <Mail className="w-5 h-5 text-gray-300" />
            </a>
          </div>
          <p className="text-gray-400 text-sm">
            support@modelhub.com
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Model Hub. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
