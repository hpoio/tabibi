"use client";

import { useEffect, useState } from "react";
import { UserPlus, X, Loader2, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type StaffMember = {
  id: string;
  fullName: string;
  phone: string;
  role: "SECRETARY" | "ASSISTANT";
  createdAt: string;
};

export default function TeamPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  function loadStaff() {
    setLoading(true);
    api
      .get<StaffMember[]>("/staff")
      .then(setStaff)
      .catch((err) => setError(err instanceof ApiError ? err.message : "تعذّر تحميل فريق العمل"))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !phone.trim() || password.length < 6) {
      setFormError("يرجى تعبئة الاسم ورقم الهاتف، وكلمة مرور لا تقل عن 6 أحرف");
      return;
    }

    setSaving(true);
    try {
      const created = await api.post<StaffMember>("/staff", {
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
        role: "SECRETARY",
      });
      setStaff((prev) => [created, ...prev]);
      setFullName("");
      setPhone("");
      setPassword("");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "تعذّر إنشاء الحساب");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">فريق العمل</h1>
          <p className="text-foreground/50 text-sm mt-1">إدارة حسابات السكرتيرة المرتبطة بعيادتك</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-1.5 hover:bg-primary-dark"
        >
          {showForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showForm ? "إلغاء" : "إضافة سكرتيرة"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{formError}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">الاسم الكامل</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="اسم السكرتيرة"
              className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">رقم الهاتف</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555000000"
                className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>
      )}

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-foreground/30" /></div>
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-primary shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.fullName}</p>
                  <p className="text-xs text-foreground/50">{s.phone}</p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-accent-soft text-primary">سكرتيرة</span>
            </div>
          ))}
          {staff.length === 0 && <p className="p-8 text-center text-sm text-foreground/40">لا يوجد أعضاء فريق بعد</p>}
        </div>
      )}
    </div>
  );
}
