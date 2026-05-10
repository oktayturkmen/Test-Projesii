"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Vazgeç",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirming) {
        onCancel();
      }

      if (event.key === "Tab") {
        const firstFocusable = cancelButtonRef.current;
        const lastFocusable = confirmButtonRef.current;

        if (!firstFocusable || !lastFocusable) return;

        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirming, isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {description}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConfirming ? "Siliniyor..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
