"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Pencil,
  QrCode,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  FileText,
  Pill,
  FlaskConical,
  Receipt,
  CalendarClock,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { calculateAge, type PatientDetail, type Prescription, appointmentTypeLabel } from "@/lib/types";
import { QrModal } from "@/components/QrModal";
import { EditPatientModal } from "@/components/EditPatientModal";
import { PrescriptionCard } from "@/components/PrescriptionCard";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  function load() {
    setLoading(true);
    setError(null);
    api
      .get<PatientDetail>(`/patients/${id}`)
      .then(setPatient)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل بيانات المريض"))
      .finally(() => setLoading(false));
  }

  function handlePrescriptionUpdated(updated: Prescription) {
    setPatient((prev) =>
      prev ? { ...prev, prescriptions: prev.prescriptions.map((p) => (p.id === updated.id ? updated : p)) } : prev,
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-foreground/40">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/5 border border-danger/20 text-sm text-danger">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error ?? "المريض غير موجود"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/dashboard/patients")}
        className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-primary"
      >
        <ArrowRight className="w-4 h-4" />
        الرجوع لقائمة المرضى
      </button>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-accent-soft text-primary flex items-center justify-center font-bold text-lg shrink-0">
              {patient.fullName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold">{patient.fullName}</h1>
              <p className="text-sm text-foreground/50 mt-0.5">
                {calculateAge(patient.birthDate)} سنة · {patient.gender === "F" ? "أنثى" : "ذكر"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowQr(true)}
              className="h-9 px-3 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:border-accent hover:text-primary"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="h-9 px-3 rounded-lg bg-primary text-white text-xs font-medium flex items-center gap-1.5 hover:bg-primary-dark"
            >
              <Pencil className="w-3.5 h-3.5" />
              تعديل البيانات
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-foreground/60">
          {patient.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {patient.phone}
            </span>
          )}
          {patient.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {patient.address}
            </span>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground/70">
          <CalendarClock className="w-4 h-4" /> المواعيد
        </h2>
        {patient.appointments.length === 0 ? (
          <p className="text-sm text-foreground/40 card p-4">لا توجد مواعيد مسجّلة بعد</p>
        ) : (
          <div className="card divide-y divide-border">
            {patient.appointments.map((a) => (
              <div key={a.id} className="p-3.5 flex items-center justify-between text-sm">
                <span>{appointmentTypeLabel[a.type]}</span>
                <span className="text-foreground/50">
                  {new Date(a.scheduledAt).toLocaleString("ar-DZ", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground/70">
          <Pill className="w-4 h-4" /> الوصفات الطبية
        </h2>
        {patient.prescriptions.length === 0 ? (
          <p className="text-sm text-foreground/40 card p-4">لا توجد وصفات مسجّلة بعد</p>
        ) : (
          <div className="space-y-3">
            {patient.prescriptions.map((p) => (
              <PrescriptionCard key={p.id} prescription={p} onUpdated={handlePrescriptionUpdated} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground/70">
          <FileText className="w-4 h-4" /> التقارير الطبية
        </h2>
        {patient.medicalRecords.length === 0 ? (
          <p className="text-sm text-foreground/40 card p-4">لا توجد تقارير مسجّلة بعد</p>
        ) : (
          <div className="space-y-3">
            {patient.medicalRecords.map((r) => (
              <div key={r.id} className="card p-4 space-y-1.5">
                <p className="text-xs font-medium text-foreground/50">{r.templateType}</p>
                {r.diagnosis && <p className="text-sm"><span className="text-foreground/50">التشخيص:</span> {r.diagnosis}</p>}
                {r.examination && <p className="text-sm"><span className="text-foreground/50">الفحص:</span> {r.examination}</p>}
                {r.recommendations && (
                  <p className="text-sm"><span className="text-foreground/50">التوصيات:</span> {r.recommendations}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground/70">
          <FlaskConical className="w-4 h-4" /> التحاليل
        </h2>
        {patient.labResults.length === 0 ? (
          <p className="text-sm text-foreground/40 card p-4">لا توجد تحاليل مسجّلة بعد</p>
        ) : (
          <div className="card divide-y divide-border">
            {patient.labResults.map((l) => (
              <div key={l.id} className="p-3.5 flex items-center justify-between text-sm">
                <span>{l.testName}</span>
                <span className={l.isAbnormal ? "text-danger font-medium" : "text-foreground/60"}>
                  {l.value} {l.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground/70">
          <Receipt className="w-4 h-4" /> الفواتير
        </h2>
        {patient.invoices.length === 0 ? (
          <p className="text-sm text-foreground/40 card p-4">لا توجد فواتير مسجّلة بعد</p>
        ) : (
          <div className="card divide-y divide-border">
            {patient.invoices.map((inv) => (
              <div key={inv.id} className="p-3.5 flex items-center justify-between text-sm">
                <span>{inv.service}</span>
                <span className="text-foreground/60">{inv.amount} دج</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {showQr && <QrModal patient={patient} onClose={() => setShowQr(false)} />}
      {showEdit && (
        <EditPatientModal
          patient={patient}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            setPatient((prev) => (prev ? { ...prev, ...updated } : prev));
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}
