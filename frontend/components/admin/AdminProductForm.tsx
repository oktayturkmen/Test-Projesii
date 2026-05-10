"use client";

import { FormEvent, useState } from "react";
import type { AdminProductPayload } from "@/services/admin.service";

export type AdminProductFormValues = AdminProductPayload;

type AdminProductFormProps = {
  initialValues?: Partial<AdminProductFormValues>;
  submitLabel: string;
  isSubmitting: boolean;
  fieldErrors?: Partial<Record<keyof AdminProductFormValues, string>>;
  onSubmit: (values: AdminProductFormValues) => Promise<void> | void;
};

const DEFAULTS: AdminProductFormValues = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  image: "",
};

export function AdminProductForm({
  initialValues,
  submitLabel,
  isSubmitting,
  fieldErrors = {},
  onSubmit,
}: AdminProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? DEFAULTS.name);
  const [description, setDescription] = useState(
    initialValues?.description ?? DEFAULTS.description
  );
  const [price, setPrice] = useState(String(initialValues?.price ?? DEFAULTS.price));
  const [stock, setStock] = useState(String(initialValues?.stock ?? DEFAULTS.stock));
  const [image, setImage] = useState(initialValues?.image ?? DEFAULTS.image ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      stock: Number(stock),
      image: image.trim() === "" ? null : image.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        id="product-name"
        label="Ad"
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        required
        maxLength={255}
      />
      <div className="space-y-1">
        <label htmlFor="product-description" className="text-sm font-medium">
          Açıklama
        </label>
        <textarea
          id="product-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          rows={4}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={fieldErrors.description ? "product-description-error" : undefined}
          className="w-full rounded-xl border border-zinc-300 bg-white/90 px-3 py-2.5 text-sm outline-none ring-zinc-300 transition focus:ring-2 aria-[invalid=true]:border-red-500 dark:border-zinc-700 dark:bg-zinc-950/70"
        />
        {fieldErrors.description && (
          <p id="product-description-error" className="text-xs text-red-600">
            {fieldErrors.description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="product-price"
          label="Fiyat (TRY)"
          type="number"
          value={price}
          onChange={setPrice}
          error={fieldErrors.price}
          required
          min={0}
          step="0.01"
        />
        <Field
          id="product-stock"
          label="Stok"
          type="number"
          value={stock}
          onChange={setStock}
          error={fieldErrors.stock}
          required
          min={0}
          step={1}
        />
      </div>
      <Field
        id="product-image"
        label="Görsel URL (opsiyonel)"
        type="url"
        value={image}
        onChange={setImage}
        error={fieldErrors.image}
        placeholder="https://example.com/image.jpg"
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Kaydediliyor..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  required?: boolean;
  min?: number;
  maxLength?: number;
  step?: number | string;
  placeholder?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  error,
  required,
  min,
  maxLength,
  step,
  placeholder,
}: FieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        min={min}
        maxLength={maxLength}
        step={step}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-xl border border-zinc-300 bg-white/90 px-3 py-2.5 text-sm outline-none ring-zinc-300 transition focus:ring-2 aria-[invalid=true]:border-red-500 dark:border-zinc-700 dark:bg-zinc-950/70"
      />
      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
