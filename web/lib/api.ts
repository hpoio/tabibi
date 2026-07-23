import { API_URL } from "./config";
import { getToken, clearSession } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const token = auth ? getToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body && !(rest.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("انتهت الجلسة، يرجى تسجيل الدخول من جديد", 401);
  }

  if (!res.ok) {
    let message = `خطأ في الاتصال بالخادم (${res.status})`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* تجاهل - الرد ليس JSON */
    }
    throw new ApiError(Array.isArray(message) ? message.join("، ") : message, res.status);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.blob() as unknown as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  postNoAuth: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}), auth: false }),
  /** يُستخدم لتحميل ملفات (PDF مثلاً) - يعيد Blob جاهزاً للفتح/التنزيل */
  getBlob: (path: string) => request<Blob>(path, { method: "GET" }),
};
