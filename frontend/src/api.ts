import type { Application, Extracted, Status, TokenResponse, User } from "./types";

const TOKEN_STORAGE = "trackplication_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, String(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (email: string, password: string) =>
    req<TokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    req<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => req<User>("/api/auth/me"),

  listApplications: () => req<Application[]>("/api/applications"),

  extract: (text: string) =>
    req<Extracted>("/api/extract", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  createApplication: (
    payload: Extracted & {
      status?: Status;
      notes?: string;
      applied_at?: string;
      raw_input?: string;
    },
  ) =>
    req<Application>("/api/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateApplication: (id: string, patch: Partial<Application>) =>
    req<Application>(`/api/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteApplication: (id: string) =>
    req<void>(`/api/applications/${id}`, { method: "DELETE" }),
};
