"use client";

import { useState } from "react";
import { Download, Trash2, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type BackupResponse = {
  exportedAt: string;
  patientsCount: number;
  patients: unknown[];
};

export default function SettingsPage() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [wipeSuccess, setWipeSuccess] = useState<string | null>(null);

  const CONFIRM_PHRASE = "حذف كل شيء";

  async function handleBackup() {
    setBackupLoading(true);
    setBackupError(null);
    try {
      const data = await api.get<BackupResponse>("/settings/backup");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setBackupError(err instanceof ApiError ? err.message : "تعذّر إنشاء النسخة الاحتياطية");
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleWipe() {
    setWipeError(null);
    setWipeSuccess(null);
    if (confirmText !== CONFIRM_PHRASE) {
      setWipeError(`يرجى كتابة العبارة "${CONFIRM_PHRASE}" بالضبط للتأكيد`);
      return;
    }

    setWiping(true);
    try {
      const result = await api.delete<{ deletedPatientsCount: number }>("/settings/wipe-data");
      setWipeSuccess(`تم حذف ${result.deletedPatientsCount} سجل مريض وكل ما يتبعهم بنجاح`);
      setConfirmText("");
    } catch (err) {
      setWipeError(err instanceof ApiError ? err.message : "تعذّر حذف السجلات");
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-foreground/50 text-sm mt-1">النسخ الاحتياطي وإدارة البيانات</p>
      </div>

      {/* النسخ الاحتياطي */}
      <div className="card p-5 space-y-3">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          النسخ الاحتياطي
        </h2>
        <p className="text-xs text-foreground/50">
          يقوم بتحميل ملف JSON يحتوي كل بيانات مرضاك (المواعيد، الوصفات، التقارير، التحاليل، الفواتير) على جهازك مباشرة.
        </p>
        {backupError && (
          <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{backupError}</div>
        )}
        <button
          onClick={handleBackup}
          disabled={backupLoading}
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-1.5 hover:bg-primary-dark disabled:opacity-60"
        >
          {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          تحميل نسخة احتياطية
        </button>
      </div>

      {/* المنطقة الخطرة */}
      <div className="card p-5 space-y-3 border-danger/30">
        <h2 className="font-bold text-sm flex items-center gap-2 text-danger">
          <ShieldAlert className="w-4 h-4" />
          منطقة خطرة
        </h2>
        <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            هذا الإجراء سيحذف <strong>كل</strong> مرضاك ومواعيدهم ووصفاتهم وتقاريرهم وتحاليلهم وفواتيرهم
            بشكل <strong>نهائي وغير قابل للتراجع</strong>. ننصح بشدة بتحميل نسخة احتياطية أولاً.
          </span>
        </div>

        {wipeSuccess && (
          <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-xs text-success">{wipeSuccess}</div>
        )}
        {wipeError && (
          <div className="p-3 rounded-xl bg-danger/5 border border-danger/20 text-xs text-danger">{wipeError}</div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1.5">
            للتأكيد، اكتب العبارة التالية بالضبط: <span className="font-bold">{CONFIRM_PHRASE}</span>
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-full h-11 rounded-xl border border-danger/30 px-3 text-sm outline-none focus:ring-2 focus:ring-danger"
          />
        </div>

        <button
          onClick={handleWipe}
          disabled={wiping || confirmText !== CONFIRM_PHRASE}
          className="h-10 px-4 rounded-xl bg-danger text-white text-sm font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40"
        >
          {wiping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          حذف جميع السجلات نهائياً
        </button>
      </div>
    </div>
  );
}
