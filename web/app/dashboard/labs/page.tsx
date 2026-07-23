"use client";

import { useEffect, useState } from "react";
import { Upload, FlaskConical, Loader2, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Patient, LabResult } from "@/lib/types";

type Suggestion = { rawLine: string; testNameGuess?: string; valueGuess?: number; unitGuess?: string };

export default function LabsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [results, setResults] = useState<LabResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // إدخال يدوي
  const [manualName, setManualName] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [manualUnit, setManualUnit] = useState("");

  useEffect(() => {
    api.get<Patient[]>("/patients").then((list) => {
      setPatients(list);
      if (list[0]) setPatientId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!patientId) return;
    setLoadingResults(true);
    api
      .get<LabResult[]>(`/lab-results/patient/${patientId}`)
      .then((r) => setResults(r.reverse()))
      .catch(() => setResults([]))
      .finally(() => setLoadingResults(false));
  }, [patientId]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setSuggestions(null);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post<{ rawText: string; suggestions: Suggestion[] }>("/ocr/lab-result", form);
      setSuggestions(res.suggestions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تحليل الصورة");
    } finally {
      setScanning(false);
    }
  }

  async function saveResult(testName: string, value: number, unit: string) {
    try {
      const saved = await api.post<LabResult>("/lab-results", { patientId, testName, value, unit });
      setResults((prev) => [saved, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ النتيجة");
    }
  }

  function acceptSuggestion(s: Suggestion) {
    if (!s.testNameGuess || s.valueGuess === undefined) return;
    saveResult(s.testNameGuess, s.valueGuess, s.unitGuess ?? "");
    setSuggestions((prev) => prev?.filter((x) => x !== s) ?? null);
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName || !manualValue) return;
    await saveResult(manualName, parseFloat(manualValue), manualUnit);
    setManualName("");
    setManualValue("");
    setManualUnit("");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">نتائج التحاليل</h1>
        <p className="text-foreground/50 text-sm mt-1">استورد بالصورة أو أدخل يدوياً</p>
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

      {/* استيراد بالصورة (OCR) */}
      <div className="card p-5">
        <h2 className="font-bold flex items-center gap-2 mb-3">
          <Upload className="w-[18px] h-[18px] text-primary" />
          استيراد نتيجة من صورة
        </h2>
        <p className="text-xs text-foreground/40 mb-3">
          ⚠️ ميزة تجريبية غير مُختبَرة بالكامل — راجع دقة الاقتراحات قبل الحفظ دائماً
        </p>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-accent hover:bg-accent-soft/40 transition-colors">
          <Upload className="w-6 h-6 text-foreground/40" />
          <span className="text-sm text-foreground/50">اضغط لاختيار صورة التحليل (JPG/PNG)</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
        </label>

        {scanning && (
          <div className="flex items-center gap-2 mt-4 text-sm text-foreground/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري تحليل الصورة...
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-foreground/50 mb-2">اقتراحات — راجع القيم قبل الإضافة</p>
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <p className="text-sm font-medium">{s.testNameGuess ?? "—"}</p>
                  <p className="text-xs text-foreground/50">{s.valueGuess} {s.unitGuess}</p>
                </div>
                <button
                  onClick={() => acceptSuggestion(s)}
                  className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark"
                >
                  إضافة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* إدخال يدوي */}
      <form onSubmit={handleManualAdd} className="card p-5 space-y-3">
        <h2 className="font-bold text-sm text-foreground/60">إضافة يدوية</h2>
        <div className="grid sm:grid-cols-3 gap-2">
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="اسم التحليل"
            className="h-10 rounded-lg border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            type="number"
            step="any"
            placeholder="القيمة"
            className="h-10 rounded-lg border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            value={manualUnit}
            onChange={(e) => setManualUnit(e.target.value)}
            placeholder="الوحدة (mg/dL...)"
            className="h-10 rounded-lg border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-2 hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4" />
          إضافة
        </button>
      </form>

      {/* سجل النتائج */}
      <div className="card p-5">
        <h2 className="font-bold flex items-center gap-2 mb-4">
          <FlaskConical className="w-[18px] h-[18px] text-primary" />
          السجل
        </h2>
        {loadingResults ? (
          <Loader2 className="w-5 h-5 animate-spin text-foreground/30 mx-auto" />
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  r.isAbnormal ? "border-danger/30 bg-danger/5" : "border-border"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{r.testName}</p>
                  <p className="text-xs text-foreground/50">{new Date(r.takenAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`font-bold text-sm ${r.isAbnormal ? "text-danger" : "text-foreground"}`}>
                  {r.value} {r.unit}
                </span>
              </div>
            ))}
            {results.length === 0 && (
              <p className="text-center text-sm text-foreground/40 py-6">لا توجد نتائج بعد</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
