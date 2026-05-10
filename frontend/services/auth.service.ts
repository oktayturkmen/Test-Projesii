import { apiClient } from "@/lib/axios";
import type { UserRole } from "@/lib/constants";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  data?: {
    user?: AuthUser;
  };
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthResponse> {
  const { data } = await apiClient.get<AuthResponse>("/auth/me");
  return data;
}

export async function logout(): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/logout");
  return data;
}
