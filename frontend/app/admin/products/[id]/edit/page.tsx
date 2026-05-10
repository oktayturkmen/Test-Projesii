"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AdminProductForm,
  type AdminProductFormValues,
} from "@/components/admin/AdminProductForm";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  type AdminProduct,
  fetchAdminProductDetail,
  updateAdminProduct,
} from "@/services/admin.service";

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export default function AdminProductEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  const [initial, setInitial] = useState<Partial<AdminProductFormValues> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AdminProductFormValues, string>>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!Number.isFinite(productId)) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        // Hits the admin-only `/admin/products/{id}` endpoint, which never
        // applies currency conversion. The customer `fetchProductDetail` is
        // the wrong contract here because its response can carry a
        // converted price the form would otherwise round-trip back as raw.
        const response = await fetchAdminProductDetail(productId);
        if (cancelled) return;

        if (response.success && response.data) {
          const product: AdminProduct = response.data;
          setInitial({
            name: product.name,
            description: product.description,
            price: Number(product.price ?? 0),
            stock: product.stock,
            image: product.image ?? "",
          });
        } else {
          toast.error(response.message || "Ürün getirilemedi.");
        }
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Ürün getirilemedi."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleSubmit = async (values: AdminProductFormValues) => {
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const response = await updateAdminProduct(productId, values);
      if (response.success) {
        toast.success(response.message || "Ürün güncellendi.");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(response.message || "Ürün güncellenemedi.");
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

      toast.error(getApiErrorMessage(error, "Ürün güncellenemedi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ürünü Düzenle</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            #{productId} numaralı ürünün bilgilerini güncelle.
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
        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Yükleniyor...</p>
        ) : initial ? (
          <AdminProductForm
            initialValues={initial}
            submitLabel="Değişiklikleri Kaydet"
            isSubmitting={isSubmitting}
            fieldErrors={fieldErrors}
            onSubmit={handleSubmit}
          />
        ) : (
          <p className="text-sm text-red-600">Ürün bulunamadı.</p>
        )}
      </div>
    </div>
  );
}
