"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-error";
import { type AdminUser, fetchAdminUsers } from "@/services/admin.service";

const PER_PAGE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        const response = await fetchAdminUsers(page, PER_PAGE);
        if (cancelled) return;

        if (response.success && response.data) {
          setUsers(response.data.users ?? []);
          const p = response.data.pagination;
          setPagination({
            current_page: p?.current_page ?? page,
            last_page: p?.last_page ?? 1,
            per_page: p?.per_page ?? PER_PAGE,
            total: p?.total ?? 0,
          });
        } else {
          toast.error(response.message || "Kullanıcılar getirilemedi.");
        }
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Kullanıcılar getirilemedi."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Kullanıcılar</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sistemdeki tüm kullanıcı hesapları.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Henüz kullanıcı yok.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-mono text-zinc-500">{user.id}</td>
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {user.created_at ? new Date(user.created_at).toLocaleString("tr-TR") : "—"}
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
