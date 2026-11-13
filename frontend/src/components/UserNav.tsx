"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Phone,
  Clock,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { extractPhoneFromAuthEmail, isPhoneAuthEmail } from "@/lib/phoneAuth";

export function UserNav() {
  const {
    user,
    profile,
    isLoading,
    isTrialActive,
    isTrialExpired,
    trialRemainingFormatted,
    hasCompletedProfile,
    openAuthModal,
    openOnboardingModal,
    signOut,
  } = useAuth();

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

  const phoneDisplay =
    profile?.phone_number ||
    extractPhoneFromAuthEmail(user.email) ||
    user.user_metadata?.phone_number;

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    (phoneDisplay ? `Trader (${phoneDisplay.slice(-4)})` : user.email?.split("@")[0] || "Trader");

  const initial = (displayName?.[0] || "T").toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      {/* Trial Status Pill in Navbar */}
      {hasCompletedProfile && isTrialActive && (
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <Clock className="h-3 w-3 text-amber-400" />
          <span>Trial: {trialRemainingFormatted}</span>
        </div>
      )}

      {hasCompletedProfile && isTrialExpired && (
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300">
          <Lock className="h-3 w-3 text-rose-400" />
          <span>Trial Expired</span>
        </div>
      )}

      {!hasCompletedProfile && (
        <button
          type="button"
          onClick={openOnboardingModal}
          className="flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 transition animate-pulse"
        >
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Claim 1-Day Trial</span>
        </button>
      )}

      {/* User Dropdown */}
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
          <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-800 bg-[#0d1424] p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* Header in dropdown */}
            <div className="border-b border-slate-800 pb-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[150px]">
                  {displayName}
                </span>
                <span className="flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  VERIFIED
                </span>
              </div>

              {/* Phone or Email Display */}
              {phoneDisplay && (
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-sky-300">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span>{phoneDisplay}</span>
                </div>
              )}

              {!isPhoneAuthEmail(user.email) && user.email && (
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {user.email}
                </p>
              )}

              {profile?.trading_experience && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-medium text-slate-300">
                    {profile.trading_experience}
                  </span>
                  {profile.primary_segment && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-medium text-slate-300">
                      {profile.primary_segment}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Trial Info Row in dropdown */}
            <div className="my-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">1-Day VIP Pass:</span>
                {isTrialActive && (
                  <span className="font-mono text-emerald-400 font-semibold">
                    {trialRemainingFormatted}
                  </span>
                )}
                {isTrialExpired && (
                  <span className="font-mono text-rose-400 font-semibold">
                    Expired
                  </span>
                )}
                {!hasCompletedProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      openOnboardingModal();
                    }}
                    className="font-semibold text-sky-400 underline"
                  >
                    Activate Now
                  </button>
                )}
              </div>
            </div>

            {/* Sign Out */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
