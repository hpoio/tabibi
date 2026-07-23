"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Pill,
  Stethoscope,
  Receipt,
  BarChart3,
  Settings,
  UserPlus,
  History,
  X,
} from "lucide-react";
import { getStoredUser, type StoredUser } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: StoredUser["role"][];
  color: string; // لون خلفية الشريحة الملونة خلف الأيقونة
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, roles: ["DOCTOR"], color: "bg-primary/15 text-primary" },
  { href: "/dashboard/patients", label: "المرضى", icon: Users, roles: ["DOCTOR", "SECRETARY"], color: "bg-accent/20 text-accent" },
  { href: "/dashboard/appointments", label: "المواعيد", icon: CalendarDays, roles: ["DOCTOR", "SECRETARY"], color: "bg-success/15 text-success" },
  { href: "/dashboard/reports", label: "التقارير الطبية", icon: FileText, roles: ["DOCTOR"], color: "bg-primary/15 text-primary" },
  { href: "/dashboard/prescriptions", label: "الوصفات", icon: Pill, roles: ["DOCTOR"], color: "bg-accent/20 text-accent" },
  // معطّلة - أصبحت التحاليل تُطلب كخيار داخل الوصفة
  // { href: "/dashboard/labs", label: "التحاليل", icon: FlaskConical, roles: ["DOCTOR"] },
  // معطّلة مؤقتاً - سيُعاد تفعيلها لاحقاً كإضافة
  // { href: "/dashboard/ai-assist", label: "المساعد التشخيصي", icon: Sparkles, roles: ["DOCTOR"] },
  { href: "/dashboard/network", label: "شبكة الأطباء", icon: Stethoscope, roles: ["DOCTOR"], color: "bg-danger/15 text-danger" },
  { href: "/dashboard/invoices", label: "الفواتير", icon: Receipt, roles: ["DOCTOR", "SECRETARY"], color: "bg-success/15 text-success" },
  { href: "/dashboard/analytics", label: "الإحصائيات", icon: BarChart3, roles: ["DOCTOR"], color: "bg-primary/15 text-primary" },
  { href: "/dashboard/team", label: "فريق العمل", icon: UserPlus, roles: ["DOCTOR"], color: "bg-accent/20 text-accent" },
  { href: "/dashboard/audit-log", label: "سجل العمليات", icon: History, roles: ["DOCTOR"], color: "bg-foreground/10 text-foreground/70" },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings, roles: ["DOCTOR"], color: "bg-foreground/10 text-foreground/70" },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const visibleItems = user ? navItems.filter((item) => item.roles.includes(user.role)) : navItems;

  return (
    <>
      {/* خلفية معتمة */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* القائمة المنزلقة */}
      <aside
        className={`fixed top-0 right-0 h-screen w-72 bg-background border-l border-border z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 h-16 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-primary text-base">المساعد الطبي</span>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent-soft text-foreground/50"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all duration-200 group ${
                  active
                    ? "bg-primary text-white font-medium shadow-md shadow-primary/20"
                    : "text-foreground/70 hover:bg-accent-soft hover:text-primary"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active ? "bg-white/20 text-white" : item.color
                  }`}
                >
                  <Icon className="w-[16px] h-[16px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
