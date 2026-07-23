import type { LucideIcon } from "lucide-react";
import {
  Clock,
  CheckCircle2,
  CheckCheck,
  XCircle,
  UserX,
  AlertTriangle,
  Pill,
  FlaskConical,
  Stethoscope,
  Repeat,
  ClipboardList,
} from "lucide-react";
import type { Appointment, Invoice, PrescriptionItemType } from "@/lib/types";

type BadgeConfig = { icon: LucideIcon; label: string; color: string };

export const appointmentStatusConfig: Record<Appointment["status"], BadgeConfig> = {
  SCHEDULED: { icon: Clock, label: "مجدول", color: "bg-accent-soft text-primary" },
  CONFIRMED: { icon: CheckCircle2, label: "مؤكد", color: "bg-primary/10 text-primary" },
  DONE: { icon: CheckCheck, label: "منجز", color: "bg-success/10 text-success" },
  CANCELLED: { icon: XCircle, label: "ملغى", color: "bg-danger/10 text-danger" },
  NO_SHOW: { icon: UserX, label: "لم يحضر", color: "bg-foreground/10 text-foreground/60" },
};

export const appointmentTypeConfig: Record<Appointment["type"], BadgeConfig> = {
  NEW_CONSULTATION: { icon: Stethoscope, label: "كشف جديد", color: "bg-primary/10 text-primary" },
  FOLLOW_UP: { icon: Repeat, label: "كونترول", color: "bg-accent-soft text-primary" },
  LAB_TEST: { icon: FlaskConical, label: "تحاليل", color: "bg-success/10 text-success" },
  OTHER: { icon: ClipboardList, label: "أخرى", color: "bg-foreground/10 text-foreground" },
};

export const invoiceStatusConfig: Record<Invoice["status"], BadgeConfig> = {
  PAID: { icon: CheckCircle2, label: "مدفوعة", color: "bg-success/10 text-success" },
  UNPAID: { icon: Clock, label: "غير مدفوعة", color: "bg-accent-soft text-primary" },
  LATE: { icon: AlertTriangle, label: "متأخرة", color: "bg-danger/10 text-danger" },
};

export const prescriptionItemTypeConfig: Record<PrescriptionItemType, BadgeConfig> = {
  DRUG: { icon: Pill, label: "دواء", color: "bg-primary/10 text-primary" },
  LAB_TEST: { icon: FlaskConical, label: "تحليل", color: "bg-success/10 text-success" },
};

export function StatusBadge({ icon: Icon, label, color }: BadgeConfig) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-transform hover:scale-105 ${color}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2.4} />
      {label}
    </span>
  );
}
