"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Phone, Lock, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";

type LoginResponse = {
  accessToken: string;
  user: { id: string; fullName: string; phone: string; role: "DOCTOR" | "SECRETARY" | "PATIENT" | "ADMIN" };
};

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.postNoAuth<LoginResponse>("/auth/login", { phone, password });
      saveSession(res.accessToken, res.user);

      const destination = res.user.role === "SECRETARY" ? "/dashboard/patients" : "/dashboard";
      router.push(destination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر الاتصال بالخادم. تأكد أن الباك-إند يعمل.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background-soft px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-primary">المساعد الطبي الذكي</h1>
          <p className="text-sm text-foreground/50 mt-1">تسجيل دخول الطبيب / الطاقم الطبي</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">رقم الهاتف</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555000111"
                className="w-full h-11 rounded-xl border border-border pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-border pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>

          <p className="text-xs text-center text-foreground/40 pt-1">
            بيانات تجريبية (بعد seed.ts): 0555000111 / password123
          </p>
          <p className="text-xs text-center text-foreground/50">
            ليس لديك حساب؟{" "}
            <a href="/register" className="text-primary font-medium hover:underline">
              إنشاء حساب طبيب جديد
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
