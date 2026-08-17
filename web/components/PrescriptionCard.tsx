"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Printer, Loader2, X, Check, FlaskConical, Pill } from "lucide-react";
import { StatusBadge, prescriptionItemTypeConfig } from "@/components/StatusBadge";
import { api, ApiError } from "@/lib/api";
import type { Prescription, PrescriptionItem, PrescriptionItemType } from "@/lib/types";

type Row = {
  id: string;
  itemType: PrescriptionItemType;
  drugName: string;
  dosage: string;
  duration: string;
  notes: string;
};

function toRows(items: PrescriptionItem[]): Row[] {
  return items.map((i) => ({
    id: i.id,
    itemType: i.type ?? "DRUG",
    drugName: i.drugName,
    dosage: i.dosage ?? "",
    duration: i.duration ?? "",
    notes: i.notes ?? "",
  }));
}

function generateRowId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyRow(): Row {
  return { id: generateRowId(), itemType: "DRUG", drugName: "", dosage: "", duration: "", notes: "" };
}
export function PrescriptionCard({
  prescription,
  onUpdated,
}: {
  prescription: Prescription;
  onUpdated: (p: Prescription) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => toRows(prescription.items));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setRows(toRows(prescription.items));
    setError(null);
    setEditing(true);
  }

  function updateRow(id: string, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function toggleItemType(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, itemType: r.itemType === "DRUG" ? "LAB_TEST" : "DRUG", drugName: "", dosage: "", duration: "" }
          : r
      )
    );
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
    try {
      const updated = await api.patch<Prescription>(`/prescriptions/${prescription.id}`, {
        items: rows
          .filter((r) => (r.itemType === "LAB_TEST" ? r.drugName : r.drugName && r.dosage && r.duration))
          .map((r) =>
            r.itemType === "LAB_TEST"
              ? { type: "LAB_TEST", drugName: r.drugName, notes: r.notes || undefined }
              : { type: "DRUG", drugName: r.drugName, dosage: r.dosage, duration: r.duration, notes: r.notes || undefined }
          ),
      });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  }

  async function handlePrint() {
    const blob = await api.getBlob(`/prescriptions/${prescription.id}/pdf`);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  const date = new Date(prescription.createdAt).toLocaleDateString("ar-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!editing) {
    return (
      <div className="border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground/50">{date}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:border-accent hover:text-primary"
            >
              <Printer className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={startEdit}
              className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium flex items-center gap-1.5 hover:border-accent hover:text-primary"
            >
              <Pencil className="w-3.5 h-3.5" />
              تعديل
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          {prescription.items.map((item) => (
            <div key={item.id} className="text-sm flex items-center gap-2 flex-wrap">
              <StatusBadge {...prescriptionItemTypeConfig[item.type ?? "DRUG"]} />
              <span className="font-medium">{item.drugName}</span>
              {item.type === "LAB_TEST" ? (
                item.notes && <span className="text-foreground/40">({item.notes})</span>
              ) : (
                <>
                  <span className="text-foreground/50">— {item.dosage} — {item.duration}</span>
                  {item.notes && <span className="text-foreground/40">({item.notes})</span>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-accent rounded-xl p-4 space-y-3 bg-accent-soft/20">
      {error && <div className="p-2.5 rounded-lg bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={row.id} className="border border-border rounded-xl p-3 relative bg-background">
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
                <div className="grid sm:grid-cols-2 gap-2 mb-2">
                  <input
                    value={row.drugName}
                    onChange={(e) => updateRow(row.id, "drugName", e.target.value)}
                    placeholder="اسم الدواء"
                    className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    value={row.dosage}
                    onChange={(e) => updateRow(row.id, "dosage", e.target.value)}
                    placeholder="الجرعة"
                    className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    value={row.duration}
                    onChange={(e) => updateRow(row.id, "duration", e.target.value)}
                    placeholder="المدة"
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
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  value={row.drugName}
                  onChange={(e) => updateRow(row.id, "drugName", e.target.value)}
                  placeholder="اسم التحليل المطلوب"
                  className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={row.notes}
                  onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                  placeholder="ملاحظات (اختياري)"
                  className="h-10 rounded-lg border border-border px-2 text-sm outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="w-full h-9 rounded-lg border border-dashed border-border text-xs text-foreground/60 flex items-center justify-center gap-1.5 hover:border-accent hover:text-primary"
      >
        <Plus className="w-3.5 h-3.5" />
        إضافة عنصر آخر (دواء أو تحليل)
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          حفظ
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-accent-soft"
        >
          <X className="w-4 h-4" />
          إلغاء
        </button>
      </div>
    </div>
  );
}
