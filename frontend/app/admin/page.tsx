"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StatCard } from "@/components/admin/StatCard";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  type AdminStatsResponse,
  fetchAdminStats,
} from "@/services/admin.service";

type Totals = NonNullable<AdminStatsResponse["data"]>["totals"];

export default function AdminDashboardPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetchAdminStats();
        if (cancelled) return;
        if (response.success && response.data) {
          setTotals(response.data.totals);
        } else {
          toast.error(response.message || "Yönetim özeti getirilemedi.");
        }
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Yönetim özeti getirilemedi."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Genel Özet</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Mağazanın anlık durumuna hızlı bakış.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Toplam Ürün"
          value={isLoading ? "—" : (totals?.products ?? 0).toLocaleString("tr-TR")}
        />
        <StatCard
          label="Toplam Sipariş"
          value={isLoading ? "—" : (totals?.orders ?? 0).toLocaleString("tr-TR")}
        />
        <StatCard
          label="Toplam Kullanıcı"
          value={isLoading ? "—" : (totals?.users ?? 0).toLocaleString("tr-TR")}
        />
      </div>
    </div>
  );
}
