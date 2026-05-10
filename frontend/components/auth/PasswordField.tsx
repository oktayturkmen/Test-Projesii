"use client";

import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
};

export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete,
  minLength,
  placeholder = "********",
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-20 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-[invalid=true]:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label={isVisible ? "Şifreyi gizle" : "Şifreyi göster"}
        >
          {isVisible ? "Gizle" : "Göster"}
        </button>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

