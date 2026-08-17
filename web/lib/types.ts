export type Patient = {
  id: string;
  fullName: string;
  birthDate: string;
  gender: "M" | "F";
  phone?: string | null;
  address?: string | null;
  qrCodeId: string;
  createdAt: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  type: "NEW_CONSULTATION" | "FOLLOW_UP" | "LAB_TEST" | "OTHER";
  status: "SCHEDULED" | "CONFIRMED" | "DONE" | "CANCELLED" | "NO_SHOW";
  scheduledAt: string;
  durationMin: number;
  notes?: string | null;
  patient?: { id: string; fullName: string; phone?: string | null };
};

export type Drug = {
  id: string;
  tradeName: string;
  scientificName?: string | null;
  form?: string | null;
  strength?: string | null;
};

export type PrescriptionItemType = "DRUG" | "LAB_TEST";

export type PrescriptionItem = {
  id: string;
  type?: PrescriptionItemType;
  drugName: string;
  scientificName?: string | null;
  dosage?: string | null;
  duration?: string | null;
  notes?: string | null;
};

export type Prescription = {
  id: string;
  patientId: string;
  items: PrescriptionItem[];
  createdAt: string;
};

export type MedicalReport = {
  id: string;
  templateType: string;
  examination?: string | null;
  diagnosis?: string | null;
  recommendations?: string | null;
  createdAt: string;
};

export type PatientDetail = Patient & {
  appointments: Appointment[];
  medicalRecords: MedicalReport[];
  prescriptions: Prescription[];
  labResults: LabResult[];
  invoices: Invoice[];
};

export type LabResult = {
  id: string;
  testName: string;
  value: number;
  unit: string;
  normalMin?: number | null;
  normalMax?: number | null;
  isAbnormal: boolean;
  takenAt: string;
  patient?: { fullName: string };
};

export type Invoice = {
  id: string;
  patientId: string;
  amount: string; // Prisma Decimal يصل كسلسلة نصية عبر JSON
  status: "PAID" | "UNPAID" | "LATE";
  service: string;
  createdAt: string;
  paidAt?: string | null;
  patient?: { fullName: string };
};

export type Consultation = {
  id: string;
  caseText: string;
  caseAnonymized: boolean;
  createdAt: string;
  requester?: { specialty: string; user: { fullName: string } };
  replies: { id: string; replyText: string; createdAt: string; doctor?: { user: { fullName: string } } }[];
};

export type AnalyticsDashboard = {
  totalPatients: number;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  unpaidInvoicesCount: number;
  appointmentsByType: { type: string; count: number }[];
};

export const appointmentTypeLabel: Record<Appointment["type"], string> = {
  NEW_CONSULTATION: "كشف جديد",
  FOLLOW_UP: "كونترول",
  LAB_TEST: "تحاليل",
  OTHER: "أخرى",
};

export const appointmentTypeColor: Record<Appointment["type"], string> = {
  NEW_CONSULTATION: "bg-primary/10 text-primary",
  FOLLOW_UP: "bg-accent-soft text-primary",
  LAB_TEST: "bg-success/10 text-success",
  OTHER: "bg-border text-foreground",
};

export type LabResultRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type OcrSuggestion = {
  rawLine: string;
  testNameGuess?: string;
  valueGuess?: number;
  unitGuess?: string;
};

export type LabResultRequest = {
  id: string;
  patientId: string;
  doctorId: string;
  rawText: string;
  suggestions: OcrSuggestion[];
  status: LabResultRequestStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  patient?: { fullName: string };
};

export const labResultRequestStatusLabel: Record<LabResultRequestStatus, string> = {
  PENDING: "معلّق",
  APPROVED: "موافَق عليه",
  REJECTED: "مرفوض",
};

export const labResultRequestStatusColor: Record<LabResultRequestStatus, string> = {
  PENDING: "bg-orange-500/10 text-orange-600",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
};

export function calculateAge(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}