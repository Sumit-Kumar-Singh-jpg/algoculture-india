"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialRemainingFormatted: string;
  hasCompletedProfile: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "signin" | "signup";
  isOnboardingModalOpen: boolean;
  openAuthModal: (mode?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  openOnboardingModal: () => void;
  closeOnboardingModal: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [trialRemainingFormatted, setTrialRemainingFormatted] = useState<string>("");

  const calculateTrialTime = useCallback((trialEndsAt: string) => {
    const end = new Date(trialEndsAt).getTime();
    const now = Date.now();
    const diffMs = end - now;

    if (diffMs <= 0) {
      setTrialRemainingFormatted("Expired");
      return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    setTrialRemainingFormatted(`${hours}h ${mins}m left`);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.warn("Could not load user profile:", error);
      }

      if (data) {
        setProfile(data as UserProfile);
        calculateTrialTime(data.trial_ends_at);
        setIsOnboardingModalOpen(false);
      } else {
        // User logged in but has not yet completed phone & personal details
        setProfile(null);
        setIsOnboardingModalOpen(true);
      }
    } catch (err) {
      console.warn("Error refreshing profile:", err);
    } finally {
      setIsProfileLoading(false);
    }
  }, [user, calculateTrialTime]);

  useEffect(() => {
    // 1. Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // When user changes, fetch profile
  useEffect(() => {
    if (user) {
      refreshProfile();
    } else {
      setProfile(null);
      setIsOnboardingModalOpen(false);
    }
  }, [user, refreshProfile]);

  // Periodic trial countdown update
  useEffect(() => {
    if (!profile?.trial_ends_at) return;
    calculateTrialTime(profile.trial_ends_at);
    const interval = setInterval(() => {
      calculateTrialTime(profile.trial_ends_at);
    }, 60_000);
    return () => clearInterval(interval);
  }, [profile, calculateTrialTime]);

  function openAuthModal(mode: "signin" | "signup" = "signin") {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false);
  }

  function openOnboardingModal() {
    setIsOnboardingModalOpen(true);
  }

  function closeOnboardingModal() {
    setIsOnboardingModalOpen(false);
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsOnboardingModalOpen(false);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  const hasCompletedProfile = Boolean(profile?.phone_number);
  const trialEndMs = profile?.trial_ends_at ? new Date(profile.trial_ends_at).getTime() : 0;
  const isTrialActive = Boolean(hasCompletedProfile && trialEndMs > Date.now());
  const isTrialExpired = Boolean(hasCompletedProfile && trialEndMs <= Date.now());

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isProfileLoading,
        isTrialActive,
        isTrialExpired,
        trialRemainingFormatted,
        hasCompletedProfile,
        isAuthModalOpen,
        authModalMode,
        isOnboardingModalOpen,
        openAuthModal,
        closeAuthModal,
        openOnboardingModal,
        closeOnboardingModal,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
