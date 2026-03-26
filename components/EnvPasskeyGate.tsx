"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

type EnvPasskeyGateProps = {
  expectedPasskey: string;
  children: ReactNode;
  title?: string;
  placeholder?: string;
  buttonLabel?: string;
  errorMessage?: string;
};

export default function EnvPasskeyGate({
  expectedPasskey,
  children,
  title = "Enter passkey",
  placeholder = "Passkey",
  buttonLabel = "Unlock",
  errorMessage = "Incorrect passkey",
}: EnvPasskeyGateProps) {
  const [passkey, setPasskey] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const unlock = () => {
    if (passkey === expectedPasskey) {
      setIsUnlocked(true);
      setUnlockError("");
      setPasskey("");
      return;
    }

    setUnlockError(errorMessage);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      unlock();
    }
  };

  return (
    <>
      {!isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h2 className="mb-3 text-lg font-semibold text-black">{title}</h2>
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="mb-2 w-full rounded border p-2 text-black"
              autoFocus
            />
            {unlockError && (
              <div className="mb-2 text-sm text-red-600">{unlockError}</div>
            )}
            <div className="flex justify-end">
              <button
                onClick={unlock}
                className="rounded bg-blue-600 px-3 py-2 text-white"
              >
                {buttonLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={isUnlocked ? "" : "pointer-events-none blur-sm select-none"}>
        {children}
      </div>
    </>
  );
}
