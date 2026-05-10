"use client";

import { FormEvent } from "react";
import { toast } from "sonner";

export function HomeContactSection() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    toast.info("Mesaj özelliği yakında aktif olacak.");
  }

  return (
    <section
      aria-labelledby="contact-heading"
      className="border-t border-zinc-200/70 py-10 dark:border-zinc-800/70 lg:py-14"
    >
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          {/* Sol panel — koyu accent: kısa başlık + iletişim bilgileri */}
          <aside className="relative overflow-hidden bg-brand p-6 text-brand-foreground sm:p-8">
            {/* Dekoratif accent halkalar */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-foreground/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-brand-foreground/10 blur-2xl"
            />

            <div className="relative">
              <h2
                id="contact-heading"
                className="text-xl font-semibold tracking-tight sm:text-2xl"
              >
                Bize Ulaşın
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-brand-foreground/85">
                Sipariş, ürün veya üyelik hakkında bir sorun yaşıyorsan kısa bir mesaj bırak.
              </p>

              <ul className="mt-8 space-y-4 text-sm">
                <li className="flex items-center gap-3 text-brand-foreground/95">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-foreground/10 text-brand-foreground ring-1 ring-brand-foreground/15">
                    <MailIcon />
                  </span>
                  <span className="font-medium">destek@e-ticaret.test</span>
                </li>
                <li className="flex items-center gap-3 text-brand-foreground/95">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-foreground/10 text-brand-foreground ring-1 ring-brand-foreground/15">
                    <PhoneIcon />
                  </span>
                  <span className="font-medium">+90 (212) 000 00 00</span>
                </li>
                <li className="flex items-center gap-3 text-brand-foreground/95">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-foreground/10 text-brand-foreground ring-1 ring-brand-foreground/15">
                    <ClockIcon />
                  </span>
                  <span className="font-medium">Hafta içi 09:00 – 18:00</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* Sağ panel — kompakt form */}
          <form
            className="grid gap-4 p-6 sm:p-8"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ad Soyad" htmlFor="contact-name">
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Oktay Türkmen"
                />
              </Field>

              <Field label="E-posta" htmlFor="contact-email">
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  placeholder="ornek@mail.com"
                />
              </Field>
            </div>

            <Field label="Mesaj" htmlFor="contact-message">
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-2 focus:ring-brand/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-brand dark:focus:ring-brand/20"
                placeholder="Mesajınızı yazın..."
              />
            </Field>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="group inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/25"
              >
                Mesaj gönder
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-2 focus:ring-brand/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-brand dark:focus:ring-brand/20";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
