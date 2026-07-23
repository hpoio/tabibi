"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function AiAssistPage() {
  const [caseText, setCaseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.post<{ suggestionsText: string; disclaimer: string }>(
        "/ai/diagnosis-assist",
        { caseText },
      );
      setResult(res.suggestionsText);
      setDisclaimer(res.disclaimer);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذّر الاتصال بخدمة الذكاء الاصطناعي. تأكد من ضبط ANTHROPIC_API_KEY في الباك-إند.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          المساعد التشخيصي
        </h1>
        <p className="text-foreground/50 text-sm mt-1">أداة مساعدة لك وحدك — لا تصل لأي مريض</p>
      </div>

      <div className="flex gap-3 p-4 rounded-xl bg-danger/5 border border-danger/20 text-sm">
        <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
        <p className="text-foreground/80">
          هذه اقتراحات أولية فقط لمساعدتك، <b>وليست تشخيصاً نهائياً بأي حال</b>. القرار الطبي
          الكامل والمسؤولية تعود لك كطبيب معالج بناءً على فحصك السريري.
        </p>
      </div>

      {error && <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">الأعراض / نتائج الفحص / السوابق</label>
          <textarea
            required
            minLength={10}
            value={caseText}
            onChange={(e) => setCaseText(e.target.value)}
            rows={6}
            placeholder="مثال: مريضة 45 سنة، حرارة 38.5، سعال جاف منذ 3 أيام، ألم عضلي، لا سوابق مرضية..."
            className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <p className="text-xs text-foreground/40 mt-1">نصيحة: تجنّب كتابة اسم المريض الصريح هنا لخصوصية إضافية.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "جاري التحليل..." : "احصل على اقتراحات"}
        </button>
      </form>

      {result && (
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-sm text-foreground/60">الاقتراحات</h2>
          <p className="text-sm whitespace-pre-line leading-relaxed">{result}</p>
          {disclaimer && <p className="text-xs text-foreground/40 border-t border-border pt-3">{disclaimer}</p>}
        </div>
      )}
    </div>
  );
}
