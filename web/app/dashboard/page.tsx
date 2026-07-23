"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  AlertTriangle,
  MessageSquare,
  UserPlus,
  FileText,
  FlaskConical,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { appointmentTypeLabel, appointmentTypeColor, type Appointment, type LabResult } from "@/lib/types";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [abnormal, setAbnormal] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const doctorName = getStoredUser()?.fullName ?? "";

  useEffect(() => {
    Promise.all([
      api.get<Appointment[]>("/appointments/today").catch(() => []),
      api.get<LabResult[]>("/lab-results/abnormal").catch(() => []),
    ]).then(([a, l]) => {
      setAppointments(a);
      setAbnormal(l);
      setLoading(false);
    });
  }, []);

  const doneCount = appointments.filter((a) => a.status === "DONE").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary via-primary to-accent p-6 sm:p-8 text-white shadow-lg shadow-primary/20">
        <div className="absolute -left-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-2 bottom-0 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold">مرحباً، {doctorName || "..."} 👋</h1>
          <p className="text-white/70 text-sm mt-1.5">نظرة سريعة على يومك</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction href="/dashboard/patients" icon={UserPlus} label="تسجيل مريض جديد" color="bg-accent/15 text-accent" />
        <QuickAction href="/dashboard/prescriptions" icon={FileText} label="وصفة جديدة" color="bg-primary/15 text-primary" />
        <QuickAction href="/dashboard/prescriptions" icon={FlaskConical} label="طلب تحليل" color="bg-success/15 text-success" />
        <QuickAction href="/dashboard/appointments" icon={CalendarCheck} label="حجز موعد" color="bg-danger/15 text-danger" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-foreground/40">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <CalendarCheck className="w-[16px] h-[16px]" />
                </span>
                مواعيد اليوم
              </h2>
              <span className="text-xs font-medium text-foreground/50 bg-foreground/5 px-2.5 py-1 rounded-full">
                {doneCount} / {appointments.length} منجَز
              </span>
            </div>

            <div className="space-y-2">
              {appointments.map((a) => (
                <Link
                  href={`/dashboard/patients`}
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border hover:border-accent hover:bg-accent-soft/50 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-accent-soft flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {new Date(a.scheduledAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{a.patient?.fullName ?? "مريض"}</p>
                      <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full ${appointmentTypeColor[a.type]}`}>
                        {appointmentTypeLabel[a.type]}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-foreground/30 group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
                </Link>
              ))}
              {appointments.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3 text-primary/50">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-foreground/40">لا مواعيد اليوم</p>
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="card p-5">
              <h2 className="font-bold flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 rounded-xl bg-danger/15 text-danger flex items-center justify-center">
                  <AlertTriangle className="w-[16px] h-[16px]" />
                </span>
                <span className="text-danger">نتائج تحاليل غير طبيعية</span>
              </h2>
              <div className="space-y-3">
                {abnormal.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-3 last:pb-0">
                    <div>
                      <p className="font-medium">{r.patient?.fullName}</p>
                      <p className="text-foreground/50 text-xs">{r.testName}</p>
                    </div>
                    <span className="text-danger font-bold text-sm bg-danger/10 px-2.5 py-1 rounded-lg">{r.value} {r.unit}</span>
                  </div>
                ))}
                {abnormal.length === 0 && (
                  <p className="text-sm text-foreground/40">لا توجد نتائج غير طبيعية حالياً</p>
                )}
              </div>
            </section>

            <section className="card p-5">
              <h2 className="font-bold flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  <MessageSquare className="w-[16px] h-[16px]" />
                </span>
                رسائل واستشارات جديدة
              </h2>
              <p className="text-sm text-foreground/50">لا توجد رسائل جديدة حالياً.</p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: typeof CalendarCheck;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="card p-4 flex flex-col items-center gap-2.5 text-center hover:border-accent hover:-translate-y-1 hover:shadow-md transition-all duration-200 group"
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
