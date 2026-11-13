"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AlgoCulture India runtime exception captured:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#090d16] p-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0e1525] p-6 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className="mt-4 text-lg font-bold text-white">
          Terminal Interruption
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          A client-side state issue was caught safely by the AlgoCulture Error Guard. The trading terminal data has been preserved.
        </p>

        {error?.message && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-left font-mono text-[11px] text-rose-300 break-all">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-sky-400 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Resume Terminal
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <Home className="h-4 w-4" />
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
