"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { TrialOnboardingModal } from "@/components/TrialOnboardingModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
      <TrialOnboardingModal />
    </AuthProvider>
  );
}
