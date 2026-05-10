"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useState } from "react";
import { toast } from "sonner";

import {
  AdminProductForm,
  type AdminProductFormValues,
} from "@/components/admin/AdminProductForm";
import { getApiErrorMessage } from "@/lib/api-error";
import { createAdminProduct } from "@/services/admin.service";

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export default function AdminProductCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AdminProductFormValues, string>>>({});

  const handleSubmit = async (values: AdminProductFormValues) => {
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await createAdminProduct(values);
      if (response.success) {
        toast.success(response.message || "Ürün oluşturuldu.");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(response.message || "Ürün oluşturulamadı.");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      const validation = axiosError.response?.data?.errors;

      if (axiosError.response?.status === 422 && validation) {
        setFieldErrors({
          name: validation.name?.[0],
          description: validation.description?.[0],
          price: validation.price?.[0],
          stock: validation.stock?.[0],
          image: validation.image?.[0],
        });
      }

      toast.error(getApiErrorMessage(error, "Ürün oluşturulamadı."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Yeni Ürün</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Mağazaya eklenecek ürünün bilgilerini gir.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Vazgeç
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <AdminProductForm
          submitLabel="Ürünü Oluştur"
          isSubmitting={isSubmitting}
          fieldErrors={fieldErrors}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
