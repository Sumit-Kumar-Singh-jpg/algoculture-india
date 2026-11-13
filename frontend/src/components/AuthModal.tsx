"use client";

import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  Lock,
  User,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import {
  isValidIndianPhone,
  formatE164IndianPhone,
  phoneToAuthEmail,
} from "@/lib/phoneAuth";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, refreshProfile } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(authModalMode);
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");

  // Phone auth fields
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");

  // Email auth fields
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Personal details for sign up
  const [fullName, setFullName] = useState("");
  const [cityState, setCityState] = useState("");
  const [experience, setExperience] = useState("Intermediate");
  const [segment, setSegment] = useState("Equity Intraday");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync mode with context
  React.useEffect(() => {
    setMode(authModalMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  async function handlePhoneAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isValidIndianPhone(phone)) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    if (phonePassword.length < 6) {
      setErrorMsg("Password/PIN must be at least 6 characters long.");
      return;
    }

    const formattedPhone = formatE164IndianPhone(phone);
    const virtualEmail = phoneToAuthEmail(phone);

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: phonePassword,
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid mobile number or password. If you are new, click 'Create Account'.");
          }
          throw error;
        }
        await refreshProfile();
        closeAuthModal();
      } else {
        // Sign up flow
        const trimmedName = fullName.trim();
        if (!trimmedName) {
          setErrorMsg("Please enter your full name.");
          setLoading(false);
          return;
        }

        // 1. Anti-abuse check: verify phone hasn't already been used for trial
        const { data: alreadyClaimed } = await supabase.rpc(
          "check_phone_trial_claimed",
          { phone_input: formattedPhone }
        );

        if (alreadyClaimed === true) {
          throw new Error(
            `This mobile number (${formattedPhone}) has already claimed a 1-day free trial. Each phone number can only receive one trial.`
          );
        }

        // 2. Sign up user with virtual email
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: virtualEmail,
          password: phonePassword,
          options: {
            data: {
              full_name: trimmedName,
              phone_number: formattedPhone,
            },
          },
        });

        if (authErr) throw authErr;

        // 3. Insert profile into user_profiles
        const userId = authData.user?.id;
        if (userId) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

          const { error: profileErr } = await supabase.from("user_profiles").insert([
            {
              user_id: userId,
              full_name: trimmedName,
              phone_number: formattedPhone,
              city_or_state: cityState.trim() || undefined,
              trading_experience: experience,
              primary_segment: segment,
              trial_started_at: now.toISOString(),
              trial_ends_at: trialEnd.toISOString(),
            },
          ]);

          if (profileErr && profileErr.code === "23505") {
            throw new Error(
              `This mobile number (${formattedPhone}) has already claimed a 1-day free trial on another account.`
            );
          }
        }

        await refreshProfile();
        closeAuthModal();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Phone authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !emailPassword) {
      setErrorMsg("Please fill in both email and password.");
      return;
    }

    if (mode === "signup" && emailPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: emailPassword,
        });
        if (error) throw error;
        await refreshProfile();
        closeAuthModal();
      } else {
        const trimmedName = fullName.trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password: emailPassword,
          options: {
            data: {
              full_name: trimmedName || undefined,
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          await refreshProfile();
          closeAuthModal();
        } else {
          setSuccessMsg(
            "Account created! Please check your email inbox to verify, then link your phone number to activate your 1-day free trial."
          );
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setErrorMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1424] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-white tracking-tight">
                AlgoCulture <span className="text-sky-400">Portal</span>
              </h2>
              <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                <Sparkles className="h-2.5 w-2.5" />
                1-Day VIP Trial
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Unique phone number required to activate trial pass
            </p>
          </div>
        </div>

        {/* Sign In vs Sign Up Tabs */}
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`rounded-md py-1.5 transition ${
              mode === "signin"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`rounded-md py-1.5 transition ${
              mode === "signup"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Primary Login Method Switcher: Phone (Primary) vs Email */}
        <div className="mb-3 flex items-center justify-center gap-2 border-b border-slate-800/80 pb-2 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setErrorMsg(null);
            }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
              authMethod === "phone"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Phone className="h-3 w-3" />
            <span>Mobile Login (Recommended)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("email");
              setErrorMsg(null);
            }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
              authMethod === "email"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mail className="h-3 w-3" />
            <span>Email</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= METHOD 1: PHONE LOGIN (PRIMARY) ================= */}
        {authMethod === "phone" && (
          <form onSubmit={handlePhoneAuth} className="space-y-3">
            {mode === "signup" && (
              <>
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-300">
                      City / State
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={cityState}
                        onChange={(e) => setCityState(e.target.value)}
                        placeholder="Mumbai"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-8 pr-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-300">
                      Experience
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 px-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                    >
                      <option value="Beginner">Beginner (&lt; 1 yr)</option>
                      <option value="Intermediate">Intermediate (1-3 yrs)</option>
                      <option value="Pro">Pro (&gt; 3 yrs)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <label className="font-medium text-slate-300">
                  Mobile Number (+91) <span className="text-rose-400">*</span>
                </label>
                {mode === "signup" && (
                  <span className="font-mono text-[10px] text-amber-400">1 Trial / Mobile</span>
                )}
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

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">
                Password or Security PIN <span className="text-rose-400">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={phonePassword}
                  onChange={(e) => setPhonePassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 uiverse-btn uiverse-btn-submit disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === "signin"
                      ? "Sign In with Mobile"
                      : "Create Account & Activate Trial"}
                  </span>
                  <div className="arrow-wrapper">
                    <div className="arrow" />
                  </div>
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= METHOD 2: EMAIL LOGIN ================= */}
        {authMethod === "email" && (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sumit Kumar"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@algoculture.in"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-amber-400/90">
              * Note: Phone number link is mandatory upon login to activate the 1-day free trial.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 uiverse-btn uiverse-btn-submit disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === "signin" ? "Sign In to Terminal" : "Create Account"}
                  </span>
                  <div className="arrow-wrapper">
                    <div className="arrow" />
                  </div>
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-3.5 flex items-center justify-center">
          <div className="w-full border-t border-slate-800" />
          <span className="absolute bg-[#0d1424] px-2 font-mono text-[10px] uppercase text-slate-500">
            Or continue with
          </span>
        </div>

        {/* Google 1-Click Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer Note */}
        <p className="mt-3 text-center text-[10px] text-slate-500">
          Secured by Supabase Row-Level Security. Strictly 1 free trial per unique Indian mobile number.
        </p>
      </div>
    </div>
  );
}
