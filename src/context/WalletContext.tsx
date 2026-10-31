import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createAccount, generatePrivateKey, createClient } from "genlayer-js";
import { CHAIN_CONFIG } from "../config/chain";

interface WalletContextType {
  account: any | null;
  privateKey: string | null;
  address: string | null;
  balance: bigint | null;
  chainId: number;
  isWrongNetwork: boolean;
  isZeroBalance: boolean;
  refreshBalance: () => Promise<void>;
  generateNewThrowawayKey: () => void;
  importKey: (key: string) => boolean;
  getClient: () => any;
}

const STORAGE_KEY = "linguaproof_throwaway_key";

const WalletContext = createContext<WalletContextType>({
  account: null,
  privateKey: null,
  address: null,
  balance: null,
  chainId: CHAIN_CONFIG.chainId,
  isWrongNetwork: false,
  isZeroBalance: true,
  refreshBalance: async () => {},
  generateNewThrowawayKey: () => {},
  importKey: () => false,
  getClient: () => null,
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [account, setAccount] = useState<any | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);

  const refreshBalanceForAddress = useCallback(async (addr: string | null) => {
    if (!addr) {
      setBalance(null);
      return;
    }
    try {
      const resp = await fetch(CHAIN_CONFIG.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "eth_getBalance",
          params: [addr, "latest"],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const hexBal = data?.result;
        if (hexBal) {
          setBalance(BigInt(hexBal));
          return;
        }
      }
      setBalance(0n);
    } catch {
      setBalance(0n);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (account?.address) {
      await refreshBalanceForAddress(String(account.address));
    }
  }, [account, refreshBalanceForAddress]);

  const initAccountFromKey = useCallback(
    (key: string) => {
      try {
        const cleanKey = key.trim();
        const formattedKey = (cleanKey.startsWith("0x") ? cleanKey : `0x${cleanKey}`) as `0x${string}`;
        const acc = createAccount(formattedKey);
        setAccount(acc);
        setPrivateKey(formattedKey);
        try {
          localStorage.setItem(STORAGE_KEY, formattedKey);
        } catch {
          // ignore
        }
        refreshBalanceForAddress(String(acc.address));
        return true;
      } catch (err) {
        console.warn("Invalid private key format:", err);
        return false;
      }
    },
    [refreshBalanceForAddress]
  );

  const generateNewThrowawayKey = useCallback(() => {
    try {
      const newKey = generatePrivateKey();
      initAccountFromKey(newKey);
    } catch (err) {
      console.error("Failed to generate private key:", err);
    }
  }, [initAccountFromKey]);

  useEffect(() => {
    let savedKey: string | null = null;
    try {
      savedKey = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    if (savedKey) {
      initAccountFromKey(savedKey);
    } else {
      generateNewThrowawayKey();
    }
  }, [initAccountFromKey, generateNewThrowawayKey]);

  const getClient = useCallback(() => {
    return createClient({
      chain: {
        id: CHAIN_CONFIG.chainId,
        name: CHAIN_CONFIG.networkName,
        rpcUrls: {
          default: { http: [CHAIN_CONFIG.rpcUrl] },
        },
      } as any,
      endpoint: CHAIN_CONFIG.rpcUrl,
      account,
    });
  }, [account]);

  const isZeroBalance = balance === null || balance === 0n;

  return (
    <WalletContext.Provider
      value={{
        account,
        privateKey,
        address: account?.address ? String(account.address) : null,
        balance,
        chainId: CHAIN_CONFIG.chainId,
        isWrongNetwork: false,
        isZeroBalance,
        refreshBalance,
        generateNewThrowawayKey,
        importKey: initAccountFromKey,
        getClient,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
