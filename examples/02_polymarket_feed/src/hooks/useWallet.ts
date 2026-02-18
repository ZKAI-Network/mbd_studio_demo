"use client";

import { useState, useEffect, useCallback } from "react";

const WALLET_KEY = "polymarket_wallet";
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

export function useWallet() {
  const [wallet, setWalletState] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(WALLET_KEY);
    if (saved) setWalletState(saved);
  }, []);

  const setWallet = useCallback((addr: string) => {
    setWalletState(addr);
    if (addr) {
      localStorage.setItem(WALLET_KEY, addr);
    } else {
      localStorage.removeItem(WALLET_KEY);
    }
  }, []);

  const clearWallet = useCallback(() => {
    setWalletState("");
    localStorage.removeItem(WALLET_KEY);
  }, []);

  const isValid = WALLET_RE.test(wallet);

  return { wallet, setWallet, isValid, clearWallet };
}
