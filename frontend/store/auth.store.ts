"use client";

import { create } from "zustand";

import {
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  fetchCurrentUser as fetchCurrentUserRequest,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "@/services/auth.service";

type AuthStore = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasCheckedSession: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  fetchMe: (force?: boolean) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
};

const initialState = {
  user: null,
  isAuthenticated: false,
  hasCheckedSession: false,
};

function syncFromResponse(
  set: (partial: Partial<AuthStore>) => void,
  response: AuthResponse
): void {
  set({
    user: response.data?.user ?? null,
    isAuthenticated: Boolean(response.data?.user),
    hasCheckedSession: true,
  });
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      hasCheckedSession: true,
    }),

  login: async (payload) => {
    const response = await loginRequest(payload);
    syncFromResponse(set, response);
    return response;
  },

  register: async (payload) => {
    const response = await registerRequest(payload);
    syncFromResponse(set, response);
    return response;
  },

  fetchMe: async (force = false) => {
    if (get().hasCheckedSession && !force) {
      const cachedUser = get().user;
      return {
        success: get().isAuthenticated,
        message: get().isAuthenticated ? "Session already synced." : "Guest session already synced.",
        data: {
          user: cachedUser ?? undefined,
        },
      };
    }

    try {
      const response = await fetchCurrentUserRequest();
      syncFromResponse(set, response);
      return response;
    } catch (error) {
      set({
        ...initialState,
        hasCheckedSession: true,
      });
      throw error;
    }
  },

  logout: async () => {
    const response = await logoutRequest();
    set(initialState);
    return response;
  },
}));
