"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Patient } from "@/lib/types";

export function NewPatientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (patient: Patient) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"M" | "F">("F");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const patient = await api.post<Patient>("/patients", { fullName, birthDate, gender, phone });
      onCreated(patient);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ المريض");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-2xl p-6 w-full max-w-md relative space-y-4"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent-soft text-foreground/50"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold text-lg">تسجيل مريض جديد</h3>

        {error && (
          <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">الاسم الكامل</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">تاريخ الميلاد</label>
            <input
              required
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">الجنس</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "M" | "F")}
              className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent bg-background"
            >
              <option value="F">أنثى</option>
              <option value="M">ذكر</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">رقم الهاتف</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0555xxxxxx"
            className="w-full h-11 rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ وتوليد رمز QR
        </button>
      </form>
    </div>
  );
}
