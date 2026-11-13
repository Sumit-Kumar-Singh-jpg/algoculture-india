"use client";

import React, { useState, useRef, useEffect } from "react";
import { User, LogIn, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function UserNav() {
  const { user, isLoading, openAuthModal, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-800/80" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openAuthModal("signin")}
          className="uiverse-btn uiverse-btn-signin"
        >
          <span>Sign In</span>
          <div className="arrow-wrapper">
            <div className="arrow" />
          </div>
        </button>
        <button
          type="button"
          onClick={() => openAuthModal("signup")}
          className="uiverse-btn uiverse-btn-signup hidden sm:inline-flex"
        >
          <span>Sign Up</span>
          <div className="arrow-wrapper">
            <div className="arrow" />
          </div>
        </button>
      </div>
    );
  }

  const initial = (user.user_metadata?.full_name?.[0] || user.email?.[0] || "T").toUpperCase();
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Trader";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-200 hover:border-slate-700 transition"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-[11px] font-bold text-white shadow">
          {initial}
        </div>
        <span className="max-w-[120px] truncate font-medium text-slate-200">
          {displayName}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-800 bg-[#0d1424] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="border-b border-slate-800 px-3 py-2 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified Account</span>
            </div>
            <p className="mt-1 truncate text-xs font-medium text-white">
              {user.email}
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
