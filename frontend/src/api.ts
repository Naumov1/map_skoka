export const API_BASE = "/api";

let refreshPromise: Promise<Response> | null = null;

const skipRefreshPaths = new Set([
  "/api/refresh",
  "/api/refresh/",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout"
]);

function getPath(input: RequestInfo | URL) {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return new URL(raw, window.location.origin).pathname;
}

function redirectToLogin() {
  if (!location.pathname.startsWith("/auth/login")) {
    history.pushState(null, "", "/auth/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

async function refreshAccessToken() {
  refreshPromise ??= fetch(`${API_BASE}/refresh/`, {
    method: "POST",
    credentials: "include",
    headers: { accept: "application/json" },
    body: ""
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { credentials: "include", ...init });
  const path = getPath(input);

  if (response.status !== 401 || !path.startsWith("/api/") || skipRefreshPaths.has(path)) {
    return response;
  }

  try {
    const refreshResponse = await refreshAccessToken();
    if (!refreshResponse.ok) {
      redirectToLogin();
      return response;
    }
    return fetch(input, { credentials: "include", ...init });
  } catch {
    redirectToLogin();
    return response;
  }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API_BASE}${path}`, {
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    ...init
  });

  let data: unknown = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const detail = typeof data === "object" && data && "detail" in data ? String((data as { detail: unknown }).detail) : `Ошибка запроса: ${response.status}`;
    throw new Error(detail);
  }

  return data as T;
}

export function apiFileUrl(path: string) {
  return `${API_BASE}${path}`;
}
