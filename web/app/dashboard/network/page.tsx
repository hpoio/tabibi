"use client";

import { useEffect, useState } from "react";
import { Stethoscope, MessageCircle, Plus, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Consultation } from "@/lib/types";

export default function NetworkPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [caseText, setCaseText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConsultations();
  }, []);

  function loadConsultations() {
    setLoading(true);
    api
      .get<Consultation[]>("/consultations")
      .then(setConsultations)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل الاستشارات"))
      .finally(() => setLoading(false));
  }

  async function handlePublish() {
    if (caseText.trim().length < 10) return;
    try {
      const created = await api.post<Consultation>("/consultations", { caseText, caseAnonymized: true });
      setConsultations((prev) => [{ ...created, replies: [] }, ...prev]);
      setShowNew(false);
      setCaseText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر نشر الحالة");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">شبكة استشارة الأطباء</h1>
          <p className="text-foreground/50 text-sm mt-1">اطرح حالة (بدون اسم المريض) واستفد من خبرة الزملاء</p>
        </div>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-2 hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4" />
          حالة جديدة
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      {showNew && (
        <div className="card p-5 space-y-3">
          <textarea
            value={caseText}
            onChange={(e) => setCaseText(e.target.value)}
            rows={4}
            placeholder="صف الحالة دون ذكر اسم المريض..."
            className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <button onClick={handlePublish} className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark">
            نشر الحالة
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-foreground/30" /></div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-accent-soft text-primary flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{c.requester?.user.fullName ?? "طبيب"}</p>
                  <p className="text-xs text-foreground/50">{c.requester?.specialty} — {new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{c.caseText}</p>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-foreground/50">
                <MessageCircle className="w-3.5 h-3.5" />
                {c.replies?.length ?? 0} رد
              </div>
            </div>
          ))}
          {consultations.length === 0 && <p className="text-center text-sm text-foreground/40 py-8">لا توجد استشارات حالياً</p>}
        </div>
      )}
    </div>
  );
}
