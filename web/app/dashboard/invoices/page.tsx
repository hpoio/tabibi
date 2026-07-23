"use client";

import { useEffect, useState } from "react";
import { Receipt, Check, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { calculateAge, appointmentTypeLabel, type Patient, type Invoice, type PatientDetail } from "@/lib/types";
import { StatusBadge, invoiceStatusConfig } from "@/components/StatusBadge";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [lastServiceLabel, setLastServiceLabel] = useState<string | null>(null);
  const [manualService, setManualService] = useState("");
  const [loadingService, setLoadingService] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
    api.get<Patient[]>("/patients").then((list) => {
      setPatients(list);
      if (list[0]) setPatientId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!patientId) return;
    setLoadingService(true);
    setLastServiceLabel(null);
    setManualService("");
    api
      .get<PatientDetail>(`/patients/${patientId}`)
      .then((detail) => {
        const lastAppointment = detail.appointments?.[0];
        if (lastAppointment) {
          setLastServiceLabel(appointmentTypeLabel[lastAppointment.type]);
        }
      })
      .catch(() => setLastServiceLabel(null))
      .finally(() => setLoadingService(false));
  }, [patientId]);

  function loadInvoices() {
    setLoading(true);
    api
      .get<Invoice[]>("/invoices")
      .then(setInvoices)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل الفواتير"))
      .finally(() => setLoading(false));
  }

  async function markPaid(id: string) {
    try {
      const updated = await api.patch<Invoice>(`/invoices/${id}/mark-paid`);
      setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تحديث الفاتورة");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const service = lastServiceLabel ?? manualService.trim();
    const parsedAmount = parseFloat(amount);

    if (!patientId || !service || !parsedAmount || parsedAmount <= 0) {
      setFormError("يرجى تعبئة كل الحقول بشكل صحيح (المبلغ يجب أن يكون أكبر من صفر)");
      return;
    }

    setSaving(true);
    try {
      const created = await api.post<Invoice>("/invoices", {
        patientId,
        service,
        amount: parsedAmount,
      });
      setInvoices((prev) => [created, ...prev]);
      setAmount("");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "تعذّر إنشاء الفاتورة");
    } finally {
      setSaving(false);
    }
  }

  const totalUnpaid = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + parseFloat(i.amount), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الفواتير</h1>
          <p className="text-foreground/50 text-sm mt-1">
            {totalUnpaid > 0 ? `${totalUnpaid.toLocaleString("fr-FR")} دج غير محصّلة` : "كل الفواتير محصّلة"}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-1.5 hover:bg-primary-dark"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "إلغاء" : "فاتورة جديدة"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{formError}</div>
          )}

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

          <div>
            <label className="block text-sm font-medium mb-1.5">الخدمة</label>
            {loadingService ? (
              <div className="h-11 rounded-xl border border-border flex items-center px-3 text-sm text-foreground/40">
                <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" />
                جاري جلب آخر عملية للمريض...
              </div>
            ) : lastServiceLabel ? (
              <div className="h-11 rounded-xl border border-border bg-foreground/5 flex items-center px-3 text-sm">
                {lastServiceLabel}
                <span className="text-[11px] text-foreground/40 mr-2">(آخر عملية مسجّلة)</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-danger">
                  <AlertCircle className="w-3.5 h-3.5" />
                  لا توجد عملية سابقة مسجّلة لهذا المريض، يرجى كتابة الخدمة يدوياً
                </div>
                <input
                  value={manualService}
                  onChange={(e) => setManualService(e.target.value)}
                  placeholder="مثال: كشف عام"
                  className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">المبلغ (دج)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="مثال: 2000"
              className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !patientId || loadingService}
            className="w-full h-11 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ الفاتورة"}
          </button>
        </form>
      )}

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-foreground/30" /></div>
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-primary shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{inv.patient?.fullName ?? "مريض"}</p>
                  <p className="text-xs text-foreground/50">{inv.service} — {new Date(inv.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm">{parseFloat(inv.amount).toLocaleString("fr-FR")} دج</span>
                <StatusBadge {...invoiceStatusConfig[inv.status]} />
                {inv.status !== "PAID" && (
                  <button
                    onClick={() => markPaid(inv.id)}
                    className="h-8 px-2.5 rounded-lg border border-border text-xs flex items-center gap-1 hover:border-success hover:text-success"
                  >
                    <Check className="w-3.5 h-3.5" />
                    تحصيل
                  </button>
                )}
              </div>
            </div>
          ))}
          {invoices.length === 0 && <p className="p-8 text-center text-sm text-foreground/40">لا توجد فواتير بعد</p>}
        </div>
      )}
    </div>
  );
}
