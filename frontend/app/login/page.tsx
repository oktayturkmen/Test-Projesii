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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const safeRedirectTarget = useMemo(
    () => resolveSafeRedirect(searchParams.get("redirect")),
    [searchParams]
  );
  const loginReason = searchParams.get("reason");
  const reasonMessage =
    loginReason === "session_expired"
      ? "Oturum süreniz doldu. Devam etmek için tekrar giriş yapın."
      : loginReason === "auth_required"
        ? "Sepet ve siparişlerinizi görüntülemek için giriş yapmalısınız."
        : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await login({
        email,
        password,
      });

      if (!response.success) {
        toast.error(response.message || "Giriş başarısız.");
        return;
      }

      toast.success("Giriş başarılı.");
      setPassword("");
      router.push(safeRedirectTarget);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      const validationErrors = axiosError.response?.data?.errors;

      if (axiosError.response?.status === 422 && validationErrors) {
        setFieldErrors({
          email: validationErrors.email?.[0],
          password: validationErrors.password?.[0],
        });
      }

      toast.error(getApiErrorMessage(error, "Giriş isteği başarısız."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Giriş Yap
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Hesabınla devam etmek için bilgilerini gir.
        </p>

        {reasonMessage && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            {reasonMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            autoComplete="current-password"
            minLength={8}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Kayıt ol
          </Link>
        </p>
      </section>
    </div>
  );
}
