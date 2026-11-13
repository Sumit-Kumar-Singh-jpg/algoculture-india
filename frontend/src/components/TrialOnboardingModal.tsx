"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Phone,
  User,
  MapPin,
  Briefcase,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { isValidIndianPhone, formatE164IndianPhone } from "@/lib/phoneAuth";

export function TrialOnboardingModal() {
  const { user, isOnboardingModalOpen, closeOnboardingModal, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [phone, setPhone] = useState("");
  const [cityState, setCityState] = useState("");
  const [experience, setExperience] = useState("Intermediate");
  const [segment, setSegment] = useState("Equity Intraday");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOnboardingModalOpen || !user) return null;

  async function handleActivateTrial(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!isValidIndianPhone(phone)) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    const formattedPhone = formatE164IndianPhone(phone);
    setLoading(true);

    try {
      // 1. Check if phone number already redeemed a trial
      const { data: alreadyClaimed, error: checkErr } = await supabase.rpc(
        "check_phone_trial_claimed",
        { phone_input: formattedPhone }
      );

      if (!checkErr && alreadyClaimed === true) {
        setErrorMsg(
          `This phone number (${formattedPhone}) has already redeemed a 1-day free trial. Each mobile number can only receive one trial.`
        );
        setLoading(false);
        return;
      }

      // 2. Insert into user_profiles
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { error: insertErr } = await supabase.from("user_profiles").insert([
        {
          user_id: user.id,
          full_name: trimmedName,
          phone_number: formattedPhone,
          city_or_state: cityState.trim() || undefined,
          trading_experience: experience,
          primary_segment: segment,
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEnd.toISOString(),
        },
      ]);

      if (insertErr) {
        if (insertErr.code === "23505" || insertErr.message.includes("unique")) {
          throw new Error(
            `This phone number (${formattedPhone}) has already redeemed a 1-day free trial on another account.`
          );
        }
        throw insertErr;
      }

      setSuccess(true);
      await refreshProfile();
      setTimeout(() => {
        closeOnboardingModal();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Failed to activate trial. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeOnboardingModal}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-sky-500/30 bg-[#0d1424] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeOnboardingModal}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
        {/* Banner Glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-sky-500 text-white shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Activate Your 1-Day VIP Trial
              </h2>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                100% FREE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Link your mobile number to unlock live AI predictions & option chain analytics
            </p>
          </div>
        </div>

        {/* Anti-Abuse Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
          <span>
            To prevent disposable email abuse, each 1-day pass requires a unique Indian mobile number and personal details.
          </span>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>1-Day Free Trial activated successfully! Welcome to AlgoCulture India.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleActivateTrial} className="mt-4 space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-300">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sumit Kumar Singh"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Indian Mobile Number */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <label className="font-medium text-slate-300">
                Mobile Number (+91) <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">1 Trial Per Mobile Number</span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1 font-mono text-xs font-semibold text-sky-400">
                <span>+91</span>
                <span className="text-slate-600">|</span>
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-14 pr-3 font-mono text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
              <Phone className="absolute right-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {/* City / State */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-300">
              City / State
            </label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={cityState}
                onChange={(e) => setCityState(e.target.value)}
                placeholder="Mumbai, Maharashtra"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Two Columns: Trading Experience & Primary Segment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">
                Trading Experience
              </label>
              <div className="relative flex items-center">
                <Briefcase className="absolute left-3 h-3.5 w-3.5 text-slate-500" />
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-8 pr-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner (&lt; 1 yr)</option>
                  <option value="Intermediate">Intermediate (1-3 yrs)</option>
                  <option value="Pro">Pro / Full-time (&gt; 3 yrs)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">
                Preferred Segment
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 px-3 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="Equity Intraday">Equity Intraday</option>
                <option value="F&O Derivatives">F&O Options & Futures</option>
                <option value="Long-Term">Long-Term Investing</option>
              </select>
            </div>
          </div>

          {/* Submit Button with Uiverse arrow styling */}
          <button
            type="submit"
            disabled={loading || success}
            className="mt-3 uiverse-btn uiverse-btn-submit disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Activate 1-Day Trial</span>
                <div className="arrow-wrapper">
                  <div className="arrow" />
                </div>
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[10px] text-slate-500">
          Trial gives 24 hours of unrestricted real-time AI price projections, multi-horizon volatility cones, and option chain analytics.
        </p>
      </div>
    </div>
  );
}
