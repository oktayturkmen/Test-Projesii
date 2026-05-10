"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/constants";
import {
  type AdminOrder,
  fetchAdminOrders,
  updateAdminOrderStatus,
} from "@/services/admin.service";

const PER_PAGE = 20;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
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
        const response = await fetchAdminOrders(page, PER_PAGE);
        if (cancelled) return;

        if (response.success && response.data) {
          setOrders(response.data.orders ?? []);
          const p = response.data.pagination;
          setPagination({
            current_page: p?.current_page ?? page,
            last_page: p?.last_page ?? 1,
            per_page: p?.per_page ?? PER_PAGE,
            total: p?.total ?? 0,
          });
        } else {
          toast.error(response.message || "Siparişler getirilemedi.");
        }
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Siparişler getirilemedi."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    setUpdatingOrderId(orderId);

    try {
      const response = await updateAdminOrderStatus(orderId, status);

      if (response.success && response.data?.order) {
        const updatedStatus = response.data.order.status;
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId ? { ...order, status: updatedStatus } : order
          )
        );
        toast.success(response.message || "Sipariş durumu güncellendi.");
      } else {
        toast.error(response.message || "Sipariş durumu güncellenemedi.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Sipariş durumu güncellenemedi."));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Siparişler</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Tüm müşteri siparişleri tek listede.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Toplam</th>
              <th className="px-4 py-3">Tarih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Henüz sipariş yok.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-zinc-500">{order.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.user?.name ?? "—"}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {order.user?.email ?? `User #${order.user_id}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <label className="sr-only" htmlFor={`order-${order.id}-status`}>
                      Sipariş durumu
                    </label>
                    <select
                      id={`order-${order.id}-status`}
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) =>
                        handleStatusChange(order.id, event.target.value as OrderStatus)
                      }
                      className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 outline-none transition focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {order.total_price} {order.currency}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {order.created_at ? new Date(order.created_at).toLocaleString("tr-TR") : "—"}
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
    </div>
  );
}
