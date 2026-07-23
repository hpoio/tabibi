"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Patient } from "@/lib/types";

type MedicalReport = {
  id: string;
  templateType: string;
  examination?: string | null;
  diagnosis?: string | null;
  recommendations?: string | null;
  createdAt: string;
};

const TEMPLATES = ["عام", "أطفال", "قلب", "نساء وتوليد"];

export default function ReportsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateType, setTemplateType] = useState(TEMPLATES[0]);
  const [examination, setExamination] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [recommendations, setRecommendations] = useState("");

  useEffect(() => {
    api.get<Patient[]>("/patients").then((list) => {
      setPatients(list);
      if (list[0]) setPatientId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    api
      .get<MedicalReport[]>(`/medical-reports/patient/${patientId}`)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await api.post<MedicalReport>("/medical-reports", {
        patientId,
        templateType,
        examination: examination || undefined,
        diagnosis: diagnosis || undefined,
        recommendations: recommendations || undefined,
      });
      setReports((prev) => [created, ...prev]);
      setExamination("");
      setDiagnosis("");
      setRecommendations("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ التقرير");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التقارير الطبية</h1>
        <p className="text-foreground/50 text-sm mt-1">فحص + تشخيص + توصيات لكل مريض</p>
      </div>

      <select
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        className="w-full max-w-sm h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent bg-background"
      >
        {patients.map((p) => (
          <option key={p.id} value={p.id}>{p.fullName}</option>
        ))}
      </select>

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      <form onSubmit={handleSave} className="card p-5 space-y-3">
        <select
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value)}
          className="h-10 rounded-lg border border-border px-3 text-sm bg-background"
        >
          {TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea
          value={examination}
          onChange={(e) => setExamination(e.target.value)}
          placeholder="الفحص السريري"
          rows={2}
          className="w-full rounded-lg border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="التشخيص"
          rows={2}
          className="w-full rounded-lg border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          placeholder="التوصيات"
          rows={2}
          className="w-full rounded-lg border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-2 hover:bg-primary-dark disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ التقرير
        </button>
      </form>

      <div className="card p-5">
        <h2 className="font-bold flex items-center gap-2 mb-4 text-sm text-foreground/60">
          <FileText className="w-4 h-4" />
          السجل
        </h2>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-foreground/30 mx-auto" />
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="p-3 rounded-xl border border-border text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{r.templateType}</span>
                  <span className="text-xs text-foreground/40">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                {r.diagnosis && <p className="text-foreground/70">{r.diagnosis}</p>}
              </div>
            ))}
            {reports.length === 0 && <p className="text-center text-foreground/40 py-6">لا توجد تقارير بعد</p>}
          </div>
        )}
      </div>
    </div>
  );
}
