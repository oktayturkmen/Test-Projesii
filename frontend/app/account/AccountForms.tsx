"use client";

import { AxiosError } from "axios";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { PasswordField } from "@/components/auth/PasswordField";
import { isAuthRedirected } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  changePassword,
  updateProfile,
} from "@/services/account.service";
import type { AuthUser } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

type ProfileFieldErrors = {
  name?: string;
  email?: string;
};

type PasswordFieldErrors = {
  current_password?: string;
  new_password?: string;
  new_password_confirmation?: string;
};

type AccountFormsProps = {
  initialUser: AuthUser;
};

export function AccountForms({ initialUser }: AccountFormsProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const storedUser = useAuthStore((state) => state.user);

  // Profile form initial values come from the SSR-prefetched user. We don't
  // sync the form back to `storedUser` afterwards on purpose: while the user
  // is mid-edit a background `setUser` call (e.g. another tab) would
  // otherwise clobber their unsaved changes.
  const baseUser = storedUser ?? initialUser;
  const [name, setName] = useState(baseUser.name);
  const [email, setEmail] = useState(baseUser.email);
  const [profileErrors, setProfileErrors] = useState<ProfileFieldErrors>({});
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Password form state.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordFieldErrors>({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileErrors({});

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Skip the round-trip if nothing changed; backend would happily 200 with
    // a no-op but the toast would lie about "guncellendi" to the user.
    if (
      trimmedName === baseUser.name &&
      trimmedEmail.toLowerCase() === baseUser.email.toLowerCase()
    ) {
      toast.info("Bilgilerde değişiklik yok.");
      return;
    }

    setProfileSubmitting(true);

    try {
      const response = await updateProfile({
        name: trimmedName,
        email: trimmedEmail,
      });

      if (!response.success) {
        toast.error(response.message || "Profil güncellenemedi.");
        return;
      }

      const updatedUser = response.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
      }

      toast.success(response.message || "Profil bilgileri güncellendi.");
    } catch (error) {
      if (isAuthRedirected(error)) {
        return;
      }

      const axiosError = error as AxiosError<ApiErrorPayload>;
      const validation = axiosError.response?.data?.errors;

      if (axiosError.response?.status === 422 && validation) {
        setProfileErrors({
          name: validation.name?.[0],
          email: validation.email?.[0],
        });
      }

      toast.error(getApiErrorMessage(error, "Profil güncellenemedi."));
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordErrors({});

    if (newPassword !== newPasswordConfirmation) {
      setPasswordErrors({
        new_password_confirmation: "Yeni şifre ile doğrulama eşleşmiyor.",
      });
      return;
    }

    setPasswordSubmitting(true);

    try {
      const response = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });

      if (!response.success) {
        toast.error(response.message || "Şifre güncellenemedi.");
        return;
      }

      toast.success(response.message || "Şifre başarıyla güncellendi.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
    } catch (error) {
      if (isAuthRedirected(error)) {
        return;
      }

      const axiosError = error as AxiosError<ApiErrorPayload>;
      const validation = axiosError.response?.data?.errors;

      if (axiosError.response?.status === 422 && validation) {
        setPasswordErrors({
          current_password: validation.current_password?.[0],
          new_password: validation.new_password?.[0],
          new_password_confirmation: validation.new_password_confirmation?.[0],
        });
      }

      toast.error(getApiErrorMessage(error, "Şifre güncellenemedi."));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Profil bilgileri
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Adın ve e-posta adresin sipariş bildirimlerinde kullanılır.
        </p>

        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
          <div className="space-y-1">
            <label htmlFor="account-name" className="text-sm font-medium">
              Ad Soyad
            </label>
            <input
              id="account-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              aria-invalid={Boolean(profileErrors.name)}
              aria-describedby={
                profileErrors.name ? "account-name-error" : undefined
              }
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-[invalid=true]:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
            />
            {profileErrors.name && (
              <p id="account-name-error" className="text-xs text-red-600">
                {profileErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="account-email" className="text-sm font-medium">
              E-posta
            </label>
            <input
              id="account-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              aria-invalid={Boolean(profileErrors.email)}
              aria-describedby={
                profileErrors.email ? "account-email-error" : undefined
              }
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-[invalid=true]:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
            />
            {profileErrors.email && (
              <p id="account-email-error" className="text-xs text-red-600">
                {profileErrors.email}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileSubmitting ? "Kaydediliyor..." : "Bilgileri kaydet"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Şifre değiştir
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          En az 10 karakter, harf, büyük/küçük karışımı ve rakam içermelidir.
        </p>

        <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
          <PasswordField
            id="current-password"
            name="current_password"
            label="Mevcut şifre"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={passwordErrors.current_password}
            autoComplete="current-password"
          />

          <PasswordField
            id="new-password"
            name="new_password"
            label="Yeni şifre"
            value={newPassword}
            onChange={setNewPassword}
            error={passwordErrors.new_password}
            autoComplete="new-password"
            minLength={10}
            hint="En az 10 karakter; harf, büyük/küçük ve rakam içermeli."
          />

          <PasswordField
            id="new-password-confirmation"
            name="new_password_confirmation"
            label="Yeni şifre (tekrar)"
            value={newPasswordConfirmation}
            onChange={setNewPasswordConfirmation}
            error={passwordErrors.new_password_confirmation}
            autoComplete="new-password"
            minLength={10}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordSubmitting ? "Güncelleniyor..." : "Şifreyi güncelle"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
