"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, CalendarCheck, Wallet, AlertCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { api, ApiError } from "@/lib/api";
import { appointmentTypeLabel, type AnalyticsDashboard, type Appointment } from "@/lib/types";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AnalyticsDashboard>("/analytics/dashboard")
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل الإحصائيات"));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          الإحصائيات
        </h1>
        <p className="text-foreground/50 text-sm mt-1">نظرة سريعة على أداء العيادة هذا الشهر</p>
      </div>

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      {!stats ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-foreground/30" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users} label="إجمالي المرضى" value={stats.totalPatients.toString()} />
            <StatCard icon={CalendarCheck} label="مواعيد هذا الشهر" value={stats.appointmentsThisMonth.toString()} />
            <StatCard icon={Wallet} label="الإيرادات هذا الشهر" value={`${Number(stats.revenueThisMonth).toLocaleString("fr-FR")} دج`} />
            <StatCard icon={AlertCircle} label="فواتير غير محصّلة" value={stats.unpaidInvoicesCount.toString()} danger />
          </div>

          <div className="card p-5">
            <h2 className="font-bold mb-4 text-sm text-foreground/60">توزيع المواعيد حسب النوع</h2>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart
                  data={stats.appointmentsByType.map((a) => ({
                    ...a,
                    type: appointmentTypeLabel[a.type as Appointment["type"]] ?? a.type,
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ direction: "rtl", borderRadius: 12 }} />
                  <Bar dataKey="count" fill="#0A5C8C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, danger }: { icon: typeof Users; label: string; value: string; danger?: boolean }) {
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${danger ? "bg-danger/10 text-danger" : "bg-accent-soft text-primary"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-foreground/50 mt-0.5">{label}</p>
    </div>
  );
}
