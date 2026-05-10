"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  type AdminProduct,
  type AdminProductsResponse,
  deleteAdminProduct,
  fetchAdminProducts,
} from "@/services/admin.service";

const PER_PAGE = 15;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [productPendingDeletion, setProductPendingDeletion] = useState<AdminProduct | null>(null);
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: PER_PAGE,
    total: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const response: AdminProductsResponse = await fetchAdminProducts(page, PER_PAGE);
        if (cancelled) return;

        if (response.success && response.data) {
          setProducts(response.data.products ?? []);
          setPagination({
            current_page: response.data.pagination?.current_page ?? page,
            last_page: response.data.pagination?.last_page ?? 1,
            per_page: response.data.pagination?.per_page ?? PER_PAGE,
            total: response.data.pagination?.total ?? 0,
          });
        } else {
          toast.error(response.message || "Ürünler getirilemedi.");
        }
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Ürünler getirilemedi."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page, reloadToken]);

  const requestDelete = (product: AdminProduct) => {
    setProductPendingDeletion(product);
  };

  const handleDeleteConfirm = async () => {
    if (!productPendingDeletion) {
      return;
    }

    const id = productPendingDeletion.id;
    setPendingDeleteId(id);

    try {
      const response = await deleteAdminProduct(id);
      if (response.success) {
        toast.success(response.message || "Ürün silindi.");
        setProductPendingDeletion(null);
        setReloadToken((token) => token + 1);
      } else {
        toast.error(response.message || "Ürün silinemedi.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Ürün silinemedi."));
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ürün Yönetimi</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Mağazadaki ürünleri görüntüle, oluştur, düzenle veya sil.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover"
        >
          Yeni Ürün
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Fiyat</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading && products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Henüz ürün yok.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-mono text-zinc-500">{product.id}</td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">
                    {product.price ?? "—"} TRY
                  </td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Düzenle
                      </Link>
                      <button
                        type="button"
                        onClick={() => requestDelete(product)}
                        disabled={pendingDeleteId === product.id}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:hover:bg-red-950/40"
                      >
                        {pendingDeleteId === product.id ? "Siliniyor..." : "Sil"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.last_page > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          lastPage={pagination.last_page}
          total={pagination.total}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      )}

      <ConfirmationModal
        isOpen={Boolean(productPendingDeletion)}
        title="Ürün silinsin mi?"
        description={
          productPendingDeletion
            ? `"${productPendingDeletion.name}" ürünü kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : ""
        }
        confirmLabel="Evet, Sil"
        isConfirming={pendingDeleteId === productPendingDeletion?.id}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (pendingDeleteId === null) {
            setProductPendingDeletion(null);
          }
        }}
      />
    </div>
  );
}
