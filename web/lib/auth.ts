// إدارة الجلسة على المتصفح. ملاحظة: هذا تطبيق Next.js حقيقي يعمل على متصفح
// عادي (وليس Artifact داخل محادثة Claude) لذا استخدام localStorage هنا سليم
// ومتوافق مع الممارسات القياسية لتطبيقات الويب الحقيقية.

export type StoredUser = {
  id: string;
  fullName: string;
  phone: string;
  role: "DOCTOR" | "SECRETARY" | "PATIENT" | "ADMIN";
};

const TOKEN_KEY = "medical_assistant_token";
const USER_KEY = "medical_assistant_user";

export function saveSession(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
