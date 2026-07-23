"use client";

import { useEffect, useState } from "react";
import { X, Printer, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";

export function QrModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ qrCodeId: string; qrImage: string }>(`/patients/${patient.id}/qr`)
      .then((res) => {
        if (!cancelled) setQrImage(res.qrImage);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [patient.id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-background rounded-2xl p-6 w-full max-w-xs text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent-soft text-foreground/50"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold mb-1">{patient.fullName}</h3>
        <p className="text-xs text-foreground/50 mb-4">
          رمز QR الخاص بالمريض — لا يحتوي بيانات طبية مباشرة
        </p>

        <div className="flex justify-center items-center p-4 bg-white rounded-xl border border-border min-h-[212px]">
          {loading && <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />}
          {qrImage && !loading && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrImage} alt={`QR - ${patient.fullName}`} width={180} height={180} />
          )}
        </div>

        <p className="text-xs text-foreground/40 mt-3">
          يُطبع على بطاقة المريض/الوصفة. عند المسح: يعرض جدول أدوية اليوم والموعد القادم فقط.
        </p>

        <button
          onClick={() => window.print()}
          className="mt-4 w-full h-10 rounded-xl bg-primary text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-dark"
        >
          <Printer className="w-4 h-4" />
          طباعة البطاقة
        </button>
      </div>
    </div>
  );
}
