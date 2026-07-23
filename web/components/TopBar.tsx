"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Moon, Sun, LogOut, Menu, Stethoscope } from "lucide-react";
import { getStoredUser, clearSession, type StoredUser } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = saved ? saved === "dark" : prefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <header className="w-full h-16 border-b border-border bg-background flex items-center gap-3 px-4 md:px-8 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        aria-label="فتح القائمة"
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-accent-soft text-primary shrink-0 transition-transform hover:scale-105"
      >
        <Menu className="w-[20px] h-[20px]" strokeWidth={2.2} />
      </button>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={handleLogout}
          aria-label="حساب التطبيق"
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 hover:opacity-90 transition-opacity"
        >
          DR
        </button>
        <div className="hidden sm:block leading-tight">
          <p className="text-sm font-medium">{user?.fullName ?? "..."}</p>
          <p className="text-xs text-foreground/50">
            {user?.role === "DOCTOR" ? "طبيب" : user?.role}
          </p>
        </div>
      </div>

      <div className="flex-1 relative mx-2">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
        <input
          type="text"
          placeholder="ابحث عن مريض بالاسم..."
          className="w-full h-10 rounded-xl border border-border bg-background-soft pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-accent transition-shadow"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleTheme}
          aria-label="الوضع الداكن"
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-accent-soft text-foreground/60"
        >
          {isDark ? (
            <Sun className="w-[18px] h-[18px]" />
          ) : (
            <Moon className="w-[18px] h-[18px]" />
          )}
        </button>
        <NotificationBell />
      </div>

      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
        <Stethoscope className="w-[18px] h-[18px] text-white" />
      </div>
    </header>
  );
}
