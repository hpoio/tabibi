"use client";

import { useEffect, useState } from "react";
import { History, Search, Download, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: { fullName: string; role: string };
};

type AuditLogResponse = {
  items: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const actionLabel: Record<string, string> = {
  POST: "إنشاء",
  PATCH: "تعديل",
  PUT: "تعديل",
  DELETE: "حذف",
};

function humanizeAction(action: string): string {
  const [method, entity] = action.split("_");
  return `${actionLabel[method] ?? method} — ${entity?.toLowerCase() ?? ""}`;
}

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => loadLogs(), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, from, to, page]);

  function loadLogs() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));
    params.set("pageSize", "20");

    api
      .get<AuditLogResponse>(`/audit-logs?${params.toString()}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل السجل"))
      .finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.items.length) return;
    const headers = ["التاريخ", "المستخدم", "الدور", "العملية", "العنصر", "IP"];
    const rows = data.items.map((e) => [
      new Date(e.createdAt).toLocaleString("fr-FR"),
      e.user?.fullName ?? "",
      e.user?.role ?? "",
      humanizeAction(e.action),
      e.entityId,
      e.ipAddress ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">سجل العمليات</h1>
          <p className="text-foreground/50 text-sm mt-1">
            {data ? `${data.total} عملية مسجّلة` : "جاري التحميل..."}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!data?.items.length}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium flex items-center gap-1.5 hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          تصدير CSV
        </button>
      </div>

      <div className="card p-4 grid sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بنوع العملية..."
            className="w-full h-10 rounded-lg border border-border pr-8 pl-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-foreground/30" /></div>
      ) : (
        <>
          <div className="card divide-y divide-border overflow-hidden">
            {data?.items.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-primary shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{humanizeAction(entry.action)}</p>
                    <p className="text-xs text-foreground/50">
                      {entry.user?.fullName ?? "مستخدم"} — {new Date(entry.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-foreground/40">{entry.ipAddress ?? "—"}</span>
              </div>
            ))}
            {data?.items.length === 0 && (
              <p className="p-8 text-center text-sm text-foreground/40">لا توجد سجلات مطابقة</p>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:border-primary disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm text-foreground/60">
                صفحة {data.page} من {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:border-primary disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
