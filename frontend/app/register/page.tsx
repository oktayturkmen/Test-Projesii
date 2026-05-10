"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PasswordField } from "@/components/auth/PasswordField";
import { useAuthStore } from "@/store/auth.store";
import { resolveSafeRedirect } from "@/lib/safe-redirect";
import { getApiErrorMessage } from "@/lib/api-error";

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
  }>({});

  const safeRedirectTarget = useMemo(
    () => resolveSafeRedirect(searchParams.get("redirect")),
    [searchParams]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (!response.success) {
        toast.error(response.message || "Kayıt başarısız.");
        return;
      }

      toast.success("Kayıt başarılı.");
      router.push(safeRedirectTarget);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      const validationErrors = axiosError.response?.data?.errors;

      if (axiosError.response?.status === 422 && validationErrors) {
        setFieldErrors({
          name: validationErrors.name?.[0],
          email: validationErrors.email?.[0],
          password: validationErrors.password?.[0],
          password_confirmation: validationErrors.password_confirmation?.[0],
        });
      }

      toast.error(getApiErrorMessage(error, "Kayıt isteği başarısız."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Kayıt Ol
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Yeni bir hesap oluşturmak için bilgilerini gir.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Ad Soyad
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-[invalid=true]:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
              placeholder="Ad Soyad"
            />
            {fieldErrors.name && (
              <p id="name-error" className="text-xs text-red-600">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-[invalid=true]:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
              placeholder="ornek@mail.com"
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <PasswordField
            id="password"
            name="password"
            label="Şifre"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            hint="En az 10 karakter; büyük harf, küçük harf ve rakam içermeli."
            autoComplete="new-password"
            minLength={10}
          />

          <PasswordField
            id="password_confirmation"
            name="password_confirmation"
            label="Şifre Tekrar"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            error={fieldErrors.password_confirmation}
            autoComplete="new-password"
            minLength={10}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Giriş yap
          </Link>
        </p>
      </section>
    </div>
  );
}
