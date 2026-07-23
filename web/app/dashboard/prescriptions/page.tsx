"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Printer, Search, Loader2, FlaskConical, Pill } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { calculateAge, type Patient, type Drug, type Prescription, type PrescriptionItemType } from "@/lib/types";

type Row = {
  id: string;
  itemType: PrescriptionItemType;
  drugName: string;
  timings: string[];
  dosageNote: string;
  duration: string;
  notes: string;
};

const TIMING_GROUPS: { key: string; label: string }[][] = [
  [
    { key: "before_breakfast", label: "قبل الفطور" },
    { key: "after_breakfast", label: "بعد الفطور" },
  ],
  [
    { key: "before_lunch", label: "قبل الغداء" },
    { key: "after_lunch", label: "بعد الغداء" },
  ],
  [
    { key: "before_dinner", label: "قبل العشاء" },
    { key: "after_dinner", label: "بعد العشاء" },
  ],
];

function emptyRow(): Row {
  return { id: crypto.randomUUID(), itemType: "DRUG", drugName: "", timings: [], dosageNote: "", duration: "", notes: "" };
}

function buildDosage(row: Row): string {
  const timingLabels = TIMING_GROUPS.flat()
    .filter((t) => row.timings.includes(t.key))
    .map((t) => t.label);
  const parts = [timingLabels.join("، "), row.dosageNote.trim()].filter(Boolean);
  return parts.join(" - ");
}

export default function PrescriptionsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [suggestFor, setSuggestFor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Drug[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Patient[]>("/patients").then((list) => {
      setPatients(list);
      if (list[0]) setPatientId(list[0].id);
    });
  }, []);

  function updateRow(id: string, field: keyof Row, value: any) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function toggleItemType(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, itemType: r.itemType === "DRUG" ? "LAB_TEST" : "DRUG", drugName: "", timings: [], dosageNote: "", duration: "" }
          : r
      )
    );
  }

  function toggleTiming(id: string, timingKey: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const has = r.timings.includes(timingKey);
        return { ...r, timings: has ? r.timings.filter((t) => t !== timingKey) : [...r.timings, timingKey] };
      })
    );
  }

  async function handleDrugSearch(rowId: string, query: string) {
    updateRow(rowId, "drugName", query);
    setSuggestFor(rowId);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await api.get<Drug[]>(`/drugs/search?q=${encodeURIComponent(query)}`);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedId(null);
    try {
      const prescription = await api.post<Prescription>("/prescriptions", {
        patientId,
        items: rows
          .filter((r) => (r.itemType === "LAB_TEST" ? r.drugName : r.drugName && buildDosage(r) && r.duration))
          .map((r) =>
            r.itemType === "LAB_TEST"
              ? {
                  type: "LAB_TEST",
                  drugName: r.drugName,
                  notes: r.notes || undefined,
                }
              : {
                  type: "DRUG",
                  drugName: r.drugName,
                  dosage: buildDosage(r),
                  duration: r.duration,
                  notes: r.notes || undefined,
                }
          ),
      });
      setSavedId(prescription.id);
      setRows([emptyRow()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ الوصفة");
    } finally {
      setSaving(false);
    }
  }

  async function handlePrint(prescriptionId: string) {
    const blob = await api.getBlob(`/prescriptions/${prescriptionId}/pdf`);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">وصفة طبية جديدة</h1>
        <p className="text-foreground/50 text-sm mt-1">اكتب اسم الدواء وستظهر اقتراحات فورية من قاعدة البيانات، أو أضف طلب تحليل</p>
      </div>

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      {savedId && (
        <div className="p-4 rounded-xl bg-success/5 border border-success/20 flex items-center justify-between text-sm">
          <span className="text-success font-medium">تم حفظ الوصفة بنجاح ✅</span>
          <button
            onClick={() => handlePrint(savedId)}
            className="h-9 px-3 rounded-lg bg-primary text-white text-xs font-medium flex items-center gap-1.5 hover:bg-primary-dark"
          >
            <Printer className="w-3.5 h-3.5" />
            فتح/طباعة PDF
          </button>
        </div>
      )}

      <div className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">المريض</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent bg-background"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} — {calculateAge(p.birthDate)} سنة
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={row.id} className="border border-border rounded-xl p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground/50">
                    {row.itemType === "LAB_TEST" ? "طلب تحليل" : "دواء"} {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleItemType(row.id)}
                    className="h-7 px-2.5 rounded-full border border-border text-xs flex items-center gap-1 text-foreground/60 hover:border-accent hover:text-primary"
                  >
                    {row.itemType === "LAB_TEST" ? <Pill className="w-3 h-3" /> : <FlaskConical className="w-3 h-3" />}
                    {row.itemType === "LAB_TEST" ? "تحويل إلى دواء" : "تحويل إلى طلب تحليل"}
                  </button>
                </div>
                <button onClick={() => removeRow(row.id)} className="text-foreground/30 hover:text-danger" aria-label="حذف">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {row.itemType === "DRUG" ? (
                <>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                    <input
                      value={row.drugName}
                      onChange={(e) => handleDrugSearch(row.id, e.target.value)}
                      onBlur={() => setTimeout(() => setSuggestFor(null), 150)}
                      placeholder="اسم الدواء"
                      className="w-full h-10 rounded-lg border border-border pr-8 pl-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                    {suggestFor === row.id && suggestions.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full card p-1 shadow-lg">
                        {suggestions.map((d) => (
                          <button
                            key={d.id}
                            onMouseDown={() => {
                              updateRow(row.id, "drugName", `${d.tradeName}${d.strength ? " " + d.strength : ""}`);
                              setSuggestFor(null);
                            }}
                            className="w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-accent-soft"
                          >
                            {d.tradeName} {d.strength}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="block text-xs text-foreground/50">وقت الجرعة</span>
                      {row.timings.length > 0 && (
                        <button
                          type="button"
                          onClick={() => updateRow(row.id, "timings", [])}
                          className="text-xs text-danger hover:underline"
                        >
                          مسح الكل
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TIMING_GROUPS.map((pair, gIdx) => (
                        <div key={gIdx} className="flex gap-1.5">
                          {pair.map((t) => {
                            const active = row.timings.includes(t.key);
                            return (
                              <button
                                key={t.key}
                                type="button"
                                onClick={() => toggleTiming(row.id, t.key)}
                                className={`h-8 px-3 rounded-full border text-xs transition-colors ${
                                  active
                                    ? "bg-primary text-white border-primary"
                                    : "border-border text-foreground/60 hover:border-accent hover:text-primary"
                                }`}
                              >
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 mb-2">
                    <input
                      value={row.dosageNote}
                      onChange={(e) => updateRow(row.id, "dosageNote", e.target.value)}
                      placeholder="تفاصيل إضافية (مثال: قرص واحد)"
                      className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      value={buildDosage(row)}
                      readOnly
                      placeholder="ستظهر هنا الجرعة الكاملة تلقائياً"
                      className="h-10 rounded-lg border border-border px-2 text-sm bg-foreground/5 text-foreground/60 outline-none"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      value={row.duration}
                      onChange={(e) => updateRow(row.id, "duration", e.target.value)}
                      placeholder="المدة (مثال: 7 أيام)"
                      className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      value={row.notes}
                      onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                      placeholder="ملاحظات (اختياري)"
                      className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative mb-2">
                    <FlaskConical className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                    <input
                      value={row.drugName}
                      onChange={(e) => updateRow(row.id, "drugName", e.target.value)}
                      placeholder="اسم التحليل المطلوب (مثال: تحليل دم شامل)"
                      className="w-full h-10 rounded-lg border border-border pr-8 pl-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <input
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                    placeholder="ملاحظات للمريض (اختياري)"
                    className="w-full h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="w-full h-10 rounded-xl border border-dashed border-border text-sm text-foreground/60 flex items-center justify-center gap-1.5 hover:border-accent hover:text-primary"
        >
          <Plus className="w-4 h-4" />
          إضافة عنصر آخر (دواء أو تحليل)
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !patientId}
          className="w-full h-11 rounded-xl bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          حفظ الوصفة
        </button>
      </div>
    </div>
  );
}
