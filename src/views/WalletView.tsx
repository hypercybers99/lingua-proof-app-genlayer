import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { CHAIN_CONFIG } from "../config/chain";
import { InAppNotice } from "../components/common/InAppNotice";
import {
  Wallet,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Key,
  ShieldAlert,
  PlusCircle,
  AlertTriangle,
} from "lucide-react";

export const WalletView: React.FC = () => {
  const {
    address,
    privateKey,
    balance,
    refreshBalance,
    generateNewThrowawayKey,
    importKey,
    isZeroBalance,
    chainId,
  } = useWallet();

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopy = (text: string, isAddr: boolean) => {
    navigator.clipboard.writeText(text);
    if (isAddr) {
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    if (!inputKey.trim()) return;

    const ok = importKey(inputKey.trim());
    if (ok) {
      setImportStatus("Wallet imported successfully!");
      setInputKey("");
    } else {
      setImportStatus("Invalid private key. Must be a 64-hex character string.");
    }
  };

  const formattedBalance =
    balance !== null ? `${(Number(balance) / 1e18).toFixed(6)} GEN` : "...";

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] dark:border-[#2D3339] pb-5">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
          Wallet &amp; Funds Manager
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage your signing keys and gas funds on {CHAIN_CONFIG.networkName}
        </p>
      </div>

      {/* Zero Balance Warning */}
      {isZeroBalance && (
        <InAppNotice
          variant="warning"
          title="Account Unfunded (0 GEN)"
          message="Transactions on GenLayer Studionet (Preview) require gas tokens. Please claim free test funds using the faucet below."
          action={{
            label: "Open Studionet Faucet",
            onClick: () => window.open(CHAIN_CONFIG.faucetUrl, "_blank"),
          }}
        />
      )}

      {/* Account Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Wallet Address
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white break-all flex items-center gap-2">
              <span>{address || "Generating wallet..."}</span>
              {address && (
                <button
                  type="button"
                  onClick={() => handleCopy(address, true)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="Copy Address"
                >
                  {copiedAddr ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-[#121518] border border-slate-200 dark:border-slate-800 text-right sm:text-right shrink-0">
            <div className="text-xs font-semibold text-slate-500">Available Balance</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white flex items-center justify-end gap-2 mt-0.5">
              <span>{formattedBalance}</span>
              <button
                type="button"
                onClick={handleRefresh}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Refresh Balance"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Network & Chain ID Badge */}
        <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#2D3339] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Connected: <strong>{CHAIN_CONFIG.networkName}</strong></span>
            <span>(Chain ID {chainId})</span>
          </div>

          <a
            href={CHAIN_CONFIG.faucetUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#0D6E6E] hover:bg-[#0A5555] text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            Claim Free Faucet GEN
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Throwaway Key Security Notice */}
      <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          Throwaway / Burner Wallet Safety Notice
        </div>
        <p className="leading-relaxed">
          For evaluation on {CHAIN_CONFIG.networkName}, LinguaProof generates a localized burner key stored in browser storage. Never deposit mainnet or valuable assets into this address. Funds are intended purely for consensus transaction execution on Studionet.
        </p>
      </div>

      {/* Export / Reveal Private Key Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm space-y-4">
        <h2 className="text-base font-serif font-bold text-[#111827] dark:text-[#F3F4F6] flex items-center gap-2">
          <Key className="w-4 h-4 text-[#0D6E6E]" />
          Throwaway Private Key
        </h2>
        <p className="text-xs text-slate-500">
          You can copy your throwaway private key to reuse across test sessions or CLI tooling.
        </p>

        {privateKey && (
          <div className="p-3 bg-[#F5F5F0] dark:bg-[#121518] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 font-mono text-xs">
            <span className="truncate text-slate-700 dark:text-slate-300">
              {privateKey}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(privateKey, false)}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 shrink-0"
              title="Copy Private Key"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={generateNewThrowawayKey}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Generate Fresh Throwaway Key
          </button>
        </div>
      </div>

      {/* Import Key Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#181C20] border border-[#E5E7EB] dark:border-[#2D3339] shadow-sm space-y-4">
        <h2 className="text-base font-serif font-bold text-[#111827] dark:text-[#F3F4F6]">
          Import Custom Key
        </h2>
        <p className="text-xs text-slate-500">
          Enter an existing 64-hex private key to restore a previously funded Studionet account.
        </p>

        <form onSubmit={handleImport} className="space-y-3">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="0x... or 64-character hex key"
            className="w-full p-2.5 text-xs bg-[#FBFBFA] dark:bg-[#121518] border border-slate-300 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100"
          />

          {importStatus && (
            <div
              className={`text-xs ${
                importStatus.includes("successfully") ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {importStatus}
            </div>
          )}

          <button
            type="submit"
            className="px-5 py-2 bg-[#0D6E6E] hover:bg-[#0A5555] text-white rounded-lg text-xs font-semibold"
          >
            Import Account
          </button>
        </form>
      </div>
    </div>
  );
};
