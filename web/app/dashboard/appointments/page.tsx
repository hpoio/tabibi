"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, XCircle, ArrowRightLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { type Appointment, type Patient } from "@/lib/types";
import { StatusBadge, appointmentStatusConfig, appointmentTypeConfig } from "@/components/StatusBadge";

function startOfWeekIso() {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function endOfWeekIso() {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState<Appointment["type"]>("FOLLOW_UP");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    load();
    api.get<Patient[]>("/patients").then((list) => {
      setPatients(list);
      if (list[0]) setPatientId(list[0].id);
    });
  }, []);

  function load() {
    setLoading(true);
    api
      .get<Appointment[]>(`/appointments?from=${startOfWeekIso()}&to=${endOfWeekIso()}`)
      .then(setAppointments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل المواعيد"))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !scheduledAt) return;
    try {
      await api.post("/appointments", { patientId, type, scheduledAt: new Date(scheduledAt).toISOString() });
      setShowNew(false);
      setScheduledAt("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حجز الموعد");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("هل تريد إلغاء هذا الموعد؟")) return;
    setBusyId(id);
    setError(null);
    try {
      await api.patch(`/appointments/${id}`, { status: "CANCELLED" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إلغاء الموعد");
    } finally {
      setBusyId(null);
    }
  }

  function startReschedule(a: Appointment) {
    setRescheduleId(a.id);
    const d = new Date(a.scheduledAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setRescheduleValue(d.toISOString().slice(0, 16));
  }

  async function confirmReschedule(id: string) {
    if (!rescheduleValue) return;
    setBusyId(id);
    setError(null);
    try {
      await api.patch(`/appointments/${id}`, { scheduledAt: new Date(rescheduleValue).toISOString() });
      setRescheduleId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تعديل موعد الحجز");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المواعيد</h1>
          <p className="text-foreground/50 text-sm mt-1">من 3 أيام قبل إلى 10 أيام قادمة</p>
        </div>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-2 hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4" />
          حجز موعد
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      {showNew && (
        <form onSubmit={handleCreate} className="card p-5 space-y-3">
          <div className="grid sm:grid-cols-3 gap-2">
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-10 rounded-lg border border-border px-3 text-sm bg-background"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Appointment["type"])}
              className="h-10 rounded-lg border border-border px-3 text-sm bg-background"
            >
              {Object.entries(appointmentTypeConfig).map(([value, cfg]) => (
                <option key={value} value={value}>{cfg.label}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-10 rounded-lg border border-border px-3 text-sm"
            />
          </div>
          <button type="submit" className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark">
            تأكيد الحجز
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-foreground/30" /></div>
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {appointments.map((a) => (
            <div key={a.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{a.patient?.fullName ?? "مريض"}</p>
                  <p className="text-xs text-foreground/50">
                    {new Date(a.scheduledAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge {...appointmentTypeConfig[a.type]} />
                  <StatusBadge {...appointmentStatusConfig[a.status]} />
                </div>
              </div>

              {a.status !== "CANCELLED" && a.status !== "DONE" && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => startReschedule(a)}
                    disabled={busyId === a.id}
                    className="h-8 px-3 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:border-accent hover:text-primary disabled:opacity-50"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    تأجيل / تقديم
                  </button>
                  <button
                    onClick={() => handleCancel(a.id)}
                    disabled={busyId === a.id}
                    className="h-8 px-3 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 text-danger hover:border-danger disabled:opacity-50"
                  >
                    {busyId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    إلغاء الموعد
                  </button>
                </div>
              )}

              {rescheduleId === a.id && (
                <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-accent-soft/30">
                  <input
                    type="datetime-local"
                    value={rescheduleValue}
                    onChange={(e) => setRescheduleValue(e.target.value)}
                    className="h-9 rounded-lg border border-border px-2 text-sm flex-1"
                  />
                  <button
                    onClick={() => confirmReschedule(a.id)}
                    disabled={busyId === a.id}
                    className="h-9 px-3 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark disabled:opacity-50"
                  >
                    تأكيد
                  </button>
                  <button
                    onClick={() => setRescheduleId(null)}
                    className="h-9 px-3 rounded-lg border border-border text-xs font-medium hover:bg-accent-soft"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          ))}
          {appointments.length === 0 && <p className="p-8 text-center text-sm text-foreground/40">لا مواعيد في هذه الفترة</p>}
        </div>
      )}
    </div>
  );
}
