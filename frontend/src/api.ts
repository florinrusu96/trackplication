import type { Application, Extracted, Status } from "./types";

const KEY_STORAGE = "trackplication_api_key";

export function getApiKey(): string | null {
  return localStorage.getItem(KEY_STORAGE);
}
export function setApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key);
}
export function clearApiKey(): void {
  localStorage.removeItem(KEY_STORAGE);
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
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getApiKey() ?? "",
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
  listApplications: () => req<Application[]>("/api/applications"),

  extract: (text: string) =>
    req<Extracted>("/api/extract", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  createApplication: (
    payload: Extracted & { status?: Status; notes?: string; raw_input?: string },
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
