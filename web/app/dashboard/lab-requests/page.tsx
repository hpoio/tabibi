"use client";

import { useEffect, useState } from "react";
import {
  ScanLine,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  type LabResultRequest,
  type LabResultRequestStatus,
  labResultRequestStatusLabel,
  labResultRequestStatusColor,
} from "@/lib/types";

type EditableLine = {
  key: string;
  checked: boolean;
  testName: string;
  value: string;
  unit: string;
  normalMin: string;
  normalMax: string;
};

const TABS: { value: LabResultRequestStatus | "ALL"; label: string }[] = [
  { value: "PENDING", label: "معلّقة" },
  { value: "APPROVED", label: "موافَق عليها" },
  { value: "REJECTED", label: "مرفوضة" },
  { value: "ALL", label: "الكل" },
];

function linesFromRequest(req: LabResultRequest): EditableLine[] {
  const suggestions = req.suggestions ?? [];
  if (suggestions.length === 0) {
    return [
      {
        key: "new-0",
        checked: true,
        testName: "",
        value: "",
        unit: "",
        normalMin: "",
        normalMax: "",
      },
    ];
  }
  return suggestions.map((s, i) => ({
    key: `sug-${i}`,
    checked: s.testNameGuess !== undefined && s.valueGuess !== undefined,
    testName: s.testNameGuess ?? "",
    value: s.valueGuess !== undefined ? String(s.valueGuess) : "",
    unit: s.unitGuess ?? "",
    normalMin: "",
    normalMax: "",
  }));
}

export default function LabRequestsPage() {
  const [tab, setTab] = useState<LabResultRequestStatus | "ALL">("PENDING");
  const [requests, setRequests] = useState<LabResultRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editLines, setEditLines] = useState<Record<string, EditableLine[]>>({});
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function load() {
    setLoading(true);
    setError(null);
    const query = tab === "ALL" ? "" : `?status=${tab}`;
    api
      .get<LabResultRequest[]>(`/lab-result-requests${query}`)
      .then(setRequests)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل الطلبات"))
      .finally(() => setLoading(false));
  }

  function toggleExpand(req: LabResultRequest) {
    if (expandedId === req.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(req.id);
    if (!editLines[req.id]) {
      setEditLines((prev) => ({ ...prev, [req.id]: linesFromRequest(req) }));
    }
  }

  function updateLine(reqId: string, key: string, patch: Partial<EditableLine>) {
    setEditLines((prev) => ({
      ...prev,
      [reqId]: prev[reqId].map((l) => (l.key === key ? { ...l, ...patch } : l)),
    }));
  }

  function addLine(reqId: string) {
    setEditLines((prev) => ({
      ...prev,
      [reqId]: [
        ...prev[reqId],
        {
          key: `new-${Date.now()}`,
          checked: true,
          testName: "",
          value: "",
          unit: "",
          normalMin: "",
          normalMax: "",
        },
      ],
    }));
  }

  function removeLine(reqId: string, key: string) {
    setEditLines((prev) => ({
      ...prev,
      [reqId]: prev[reqId].filter((l) => l.key !== key),
    }));
  }

  async function handleApprove(req: LabResultRequest) {
    const lines = (editLines[req.id] ?? []).filter((l) => l.checked);
    const items = lines
      .map((l) => ({
        testName: l.testName.trim(),
        value: parseFloat(l.value),
        unit: l.unit.trim(),
        normalMin: l.normalMin.trim() ? parseFloat(l.normalMin) : undefined,
        normalMax: l.normalMax.trim() ? parseFloat(l.normalMax) : undefined,
      }))
      .filter((l) => l.testName && l.unit && !Number.isNaN(l.value));

    if (items.length === 0) {
      setActionError((prev) => ({
        ...prev,
        [req.id]: "أضف سطراً واحداً على الأقل (اسم التحليل، القيمة، الوحدة) قبل الموافقة",
      }));
      return;
    }

    setActionLoading((prev) => ({ ...prev, [req.id]: true }));
    setActionError((prev) => ({ ...prev, [req.id]: "" }));
    try {
      await api.post(`/lab-result-requests/${req.id}/approve`, { items });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setExpandedId(null);
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [req.id]: err instanceof ApiError ? err.message : "تعذّرت الموافقة على الطلب",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [req.id]: false }));
    }
  }

  async function handleReject(req: LabResultRequest) {
    setActionLoading((prev) => ({ ...prev, [req.id]: true }));
    setActionError((prev) => ({ ...prev, [req.id]: "" }));
    try {
      await api.post(`/lab-result-requests/${req.id}/reject`, {
        note: rejectNote[req.id]?.trim() || undefined,
      });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setExpandedId(null);
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [req.id]: err instanceof ApiError ? err.message : "تعذّر رفض الطلب",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [req.id]: false }));
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلبات تحاليل المرضى</h1>
        <p className="text-foreground/50 text-sm mt-1">
          مراجعة الصور التي رفعها المرضى عبر التطبيق (OCR) قبل حفظها كنتائج رسمية
        </p>
      </div>

      {/* تبويبات الحالة */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${
              tab === t.value
                ? "bg-primary text-white"
                : "bg-accent-soft/60 text-foreground/60 hover:bg-accent-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>
      )}

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-foreground/30 mx-auto" />
      ) : requests.length === 0 ? (
        <div className="card p-8 text-center text-sm text-foreground/40">لا توجد طلبات في هذه الحالة</div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const expanded = expandedId === req.id;
            const lines = editLines[req.id] ?? [];
            const busy = !!actionLoading[req.id];
            return (
              <div key={req.id} className="card overflow-hidden">
                <button
                  onClick={() => toggleExpand(req)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-right"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                      <ScanLine className="w-[18px] h-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {req.patient?.fullName ?? "مريض"}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {new Date(req.createdAt).toLocaleString("ar-DZ", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${labResultRequestStatusColor[req.status]}`}
                    >
                      {labResultRequestStatusLabel[req.status]}
                    </span>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-foreground/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-foreground/40" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    {/* النص الخام المستخرج */}
                    <div>
                      <p className="text-xs font-medium text-foreground/50 flex items-center gap-1.5 mb-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        النص المستخرَج من الصورة
                      </p>
                      <pre className="whitespace-pre-wrap text-xs bg-accent-soft/40 rounded-xl p-3 text-foreground/70 max-h-40 overflow-y-auto font-sans">
                        {req.rawText || "—"}
                      </pre>
                    </div>

                    {req.status === "PENDING" ? (
                      <>
                        {/* الأسطر القابلة للتعديل */}
                        <div>
                          <p className="text-xs font-medium text-foreground/50 mb-2">
                            راجع/عدّل الأسطر قبل الحفظ — فعّل السطور التي تريد إضافتها فقط
                          </p>
                          <div className="space-y-2">
                            {lines.map((l) => (
                              <div
                                key={l.key}
                                className={`flex flex-wrap items-center gap-2 p-2.5 rounded-xl border ${
                                  l.checked ? "border-border" : "border-border/50 opacity-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={l.checked}
                                  onChange={(e) => updateLine(req.id, l.key, { checked: e.target.checked })}
                                  className="w-4 h-4 shrink-0 accent-primary"
                                />
                                <input
                                  value={l.testName}
                                  onChange={(e) => updateLine(req.id, l.key, { testName: e.target.value })}
                                  placeholder="اسم التحليل"
                                  className="flex-1 min-w-[110px] h-9 rounded-lg border border-border px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                                />
                                <input
                                  value={l.value}
                                  onChange={(e) => updateLine(req.id, l.key, { value: e.target.value })}
                                  type="number"
                                  step="any"
                                  placeholder="القيمة"
                                  className="w-24 h-9 rounded-lg border border-border px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                                />
                                <input
                                  value={l.unit}
                                  onChange={(e) => updateLine(req.id, l.key, { unit: e.target.value })}
                                  placeholder="الوحدة"
                                  className="w-24 h-9 rounded-lg border border-border px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                                />
                                <input
                                  value={l.normalMin}
                                  onChange={(e) => updateLine(req.id, l.key, { normalMin: e.target.value })}
                                  type="number"
                                  step="any"
                                  placeholder="الحد الأدنى"
                                  className="w-24 h-9 rounded-lg border border-border px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                                />
                                <input
                                  value={l.normalMax}
                                  onChange={(e) => updateLine(req.id, l.key, { normalMax: e.target.value })}
                                  type="number"
                                  step="any"
                                  placeholder="الحد الأقصى"
                                  className="w-24 h-9 rounded-lg border border-border px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
                                />
                                <button
                                  onClick={() => removeLine(req.id, l.key)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/40 hover:text-danger hover:bg-danger/5 shrink-0"
                                  aria-label="حذف السطر"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => addLine(req.id)}
                            className="mt-2 h-8 px-3 rounded-lg border border-dashed border-border text-xs text-foreground/60 flex items-center gap-1.5 hover:border-accent hover:text-primary"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            إضافة سطر يدوياً
                          </button>
                        </div>

                        {actionError[req.id] && (
                          <div className="p-2.5 rounded-lg bg-danger/5 border border-danger/20 text-xs text-danger">
                            {actionError[req.id]}
                          </div>
                        )}

                        {/* إجراءات الموافقة/الرفض */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={busy}
                            className="h-9 px-4 rounded-xl bg-success text-white text-sm font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            موافقة وحفظ النتائج
                          </button>
                          <input
                            value={rejectNote[req.id] ?? ""}
                            onChange={(e) => setRejectNote((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            placeholder="سبب الرفض (اختياري)"
                            className="flex-1 min-w-[160px] h-9 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
                          />
                          <button
                            onClick={() => handleReject(req)}
                            disabled={busy}
                            className="h-9 px-4 rounded-xl bg-danger text-white text-sm font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            رفض
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-foreground/60 space-y-1">
                        {req.reviewedAt && (
                          <p>
                            تمت المراجعة في{" "}
                            {new Date(req.reviewedAt).toLocaleString("ar-DZ", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        )}
                        {req.reviewNote && <p>الملاحظة: {req.reviewNote}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
