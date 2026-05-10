"use client";

import { useState } from "react";

import { useAuthStore } from "@/store/auth.store";
import type { AuthUser } from "@/services/auth.service";

type AuthHydratorProps = {
  initialUser: AuthUser | null;
};

/**
 * Seeds the Zustand auth store with the SSR-resolved user during the very
 * first client render so the navbar does not flicker between guest and
 * authenticated states on hydration. The `useState` initializer fires
 * synchronously and exactly once per component mount, which is the canonical
 * Zustand-friendly way to push server-resolved data into a vanilla store.
 */
export function AuthHydrator({ initialUser }: AuthHydratorProps) {
  useState<true>(() => {
    useAuthStore.setState({
      user: initialUser,
      isAuthenticated: Boolean(initialUser),
      hasCheckedSession: true,
    });
    return true;
  });

  return null;
}
