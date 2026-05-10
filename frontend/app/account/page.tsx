import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountForms } from "@/app/account/AccountForms";
import { getCurrentUserFromCookies } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Hesabım | E-Ticaret Test",
  description:
    "Profil bilgilerini düzenle ve hesabının şifresini güvenli şekilde değiştir.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUserFromCookies();

  // Server-side gate: send guests to /login with a redirect-back hint instead
  // of leaking a half-rendered "Hesabım" shell that the API would 401 anyway.
  if (!user) {
    redirect("/login?redirect=/account&reason=auth_required");
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Hesabım
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Profil bilgilerini güncelleyebilir veya hesabının şifresini
          değiştirebilirsin.
        </p>
      </header>

      <AccountForms initialUser={user} />
    </div>
  );
}
