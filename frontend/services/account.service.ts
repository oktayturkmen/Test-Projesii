import { apiClient } from "@/lib/axios";
import type { AuthResponse } from "@/services/auth.service";

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message: string;
};

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<AuthResponse> {
  const { data } = await apiClient.patch<AuthResponse>(
    "/account/profile",
    payload
  );
  return data;
}

export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> {
  const { data } = await apiClient.put<ChangePasswordResponse>(
    "/account/password",
    payload
  );
  return data;
}
