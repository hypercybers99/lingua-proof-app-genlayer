import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { CHAIN_CONFIG } from "../../config/chain";
import { ShieldCheck, Moon, Sun, Wallet, PlusCircle, BookOpen, Layers, ExternalLink } from "lucide-react";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { address, balance } = useWallet();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial color scheme
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
      setIsDark(true);
    }
  };

  const navLinks = [
    { to: "/translations", label: "Explorer", icon: Layers },
    { to: "/register", label: "Register", icon: PlusCircle },
    { to: "/method", label: "Methodology", icon: BookOpen },
    { to: "/evidence", label: "Evidence", icon: ShieldCheck },
    { to: "/wallet", label: "Wallet & Funds", icon: Wallet },
  ];

  const formattedBalance = balance !== null ? `${(Number(balance) / 1e18).toFixed(4)} GEN` : "...";

  return (
    <nav className="sticky top-0 z-30 bg-[#FBFBFA]/90 dark:bg-[#0F1215]/90 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2D3339]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.svg"
            alt="LinguaProof Seal"
            className="w-9 h-9 transition-transform group-hover:scale-105"
          />
          <div>
            <div className="font-serif font-bold text-lg leading-tight tracking-tight text-[#111827] dark:text-[#F3F4F6] flex items-center gap-2">
              LinguaProof
              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-[#0D6E6E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Notary
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {CHAIN_CONFIG.networkName}
            </div>
          </div>
        </Link>

        {/* Navigation items */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  isActive
                    ? "bg-[#0D6E6E]/10 text-[#0D6E6E] dark:text-teal-300 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right action group: wallet pill & theme toggle */}
        <div className="flex items-center gap-3">
          <Link
            to="/wallet"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F0] dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] rounded-lg text-xs font-mono hover:border-teal-500/50 transition"
            title={address || ""}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-sans font-medium text-slate-700 dark:text-slate-300">
              {formattedBalance}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 dark:text-slate-400">
              {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "No Wallet"}
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </nav>
  );
};
