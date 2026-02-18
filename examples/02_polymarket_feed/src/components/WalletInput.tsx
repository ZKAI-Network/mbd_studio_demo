"use client";

import { useRef, useEffect } from "react";
import { Wallet, Check, X, XCircle } from "lucide-react";

interface Props {
  wallet: string;
  isValid: boolean;
  onChange: (addr: string) => void;
  onClear: () => void;
}

export default function WalletInput({ wallet, isValid, onChange, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "w" && e.target === document.body) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card">
      <Wallet size={16} className="text-muted-foreground shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={wallet}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Wallet address (press "w")'
        className="bg-transparent flex-1 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none min-w-0"
      />
      {wallet && (
        <>
          {isValid ? (
            <Check size={14} className="text-yes shrink-0" />
          ) : (
            <X size={14} className="text-no shrink-0" />
          )}
          <button onClick={onClear} className="text-muted-foreground hover:text-foreground shrink-0">
            <XCircle size={14} />
          </button>
        </>
      )}
    </div>
  );
}
