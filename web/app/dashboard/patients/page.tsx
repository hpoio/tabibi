"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserPlus, QrCode, Phone, Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { calculateAge, type Patient } from "@/lib/types";
import { QrModal } from "@/components/QrModal";
import { NewPatientModal } from "@/components/NewPatientModal";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [qrPatient, setQrPatient] = useState<Patient | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  function loadPatients() {
    setLoading(true);
    setError(null);
    api
      .get<Patient[]>("/patients")
      .then(setPatients)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل المرضى"))
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(
    () => patients.filter((p) => p.fullName.includes(search)),
    [patients, search],
  );

  function handleCreated(newPatient: Patient) {
    setPatients((prev) => [newPatient, ...prev]);
    setShowNewModal(false);
    setQrPatient(newPatient);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المرضى</h1>
          <p className="text-foreground/50 text-sm mt-1">{patients.length} مريض مسجّل</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="h-11 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-2 hover:bg-primary-dark"
        >
          <UserPlus className="w-4 h-4" />
          تسجيل مريض جديد
        </button>
      </div>

      <input
        type="text"
        placeholder="بحث فوري بالاسم..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm h-11 rounded-xl border border-border px-4 text-sm outline-none focus:ring-2 focus:ring-accent"
      />

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/5 border border-danger/20 text-sm text-danger">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-foreground/40">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/patients/${p.id}`}
              className="flex items-center justify-between p-4 hover:bg-accent-soft/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent-soft text-primary flex items-center justify-center font-bold shrink-0">
                  {p.fullName[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{p.fullName}</p>
                  <p className="text-xs text-foreground/50 flex items-center gap-2 mt-0.5">
                    <span>{calculateAge(p.birthDate)} سنة</span>
                    {p.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {p.phone}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQrPatient(p);
                  }}
                  className="h-9 px-3 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:border-accent hover:text-primary"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR
                </button>
                <ChevronLeft className="w-4 h-4 text-foreground/30" />
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-foreground/40">لا توجد نتائج مطابقة</p>
          )}
        </div>
      )}

      {qrPatient && <QrModal patient={qrPatient} onClose={() => setQrPatient(null)} />}
      {showNewModal && (
        <NewPatientModal onClose={() => setShowNewModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
