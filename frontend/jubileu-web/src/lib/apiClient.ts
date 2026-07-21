const API_BASE_PATH = "/api";
const CSRF_COOKIE = "jubileu_csrf";
const REFRESH_LOCK = "jubileu-auth-refresh";
const REFRESH_LEASE = "jubileu:refreshLease";

let refreshPromise: Promise<boolean> | null = null;
let sessionExpiredEmitted = false;
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("jubileu-auth") : null;

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `jubileu-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function csrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const item = document.cookie.split("; ").find((entry) => entry.startsWith(`${CSRF_COOKIE}=`));
  return item ? decodeURIComponent(item.slice(CSRF_COOKIE.length + 1)) : null;
}

export function buildApiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === API_BASE_PATH || normalized.startsWith(`${API_BASE_PATH}/`)
    ? normalized
    : `${API_BASE_PATH}${normalized}`;
}

function requestInit(init: RequestInit): RequestInit {
  const headers = new Headers(init.headers);
  if (!headers.has("X-Request-ID")) headers.set("X-Request-ID", createRequestId());
  const method = (init.method ?? "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = csrfToken();
    if (csrf && !headers.has("X-CSRF-Token")) headers.set("X-CSRF-Token", csrf);
  }
  return { ...init, headers, credentials: "same-origin" };
}

async function directFetch(path: string, init: RequestInit = {}) {
  return fetch(buildApiPath(path), requestInit(init));
}

function emitSessionExpired() {
  if (sessionExpiredEmitted) return;
  sessionExpiredEmitted = true;
  channel?.postMessage({ type: "session-expired" });
  window.dispatchEvent(new CustomEvent("jubileu:session-expired"));
}

async function rotateSession(): Promise<boolean> {
  const current = await directFetch("/auth/me");
  if (current.ok) return true;
  const response = await directFetch("/auth/refresh", { method: "POST" });
  if (response.ok) {
    sessionExpiredEmitted = false;
    channel?.postMessage({ type: "session-refreshed" });
    return true;
  }
  if (response.status === 409) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return (await directFetch("/auth/me")).ok;
  }
  return false;
}

async function withLease<T>(work: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request(REFRESH_LOCK, work);
  const owner = createRequestId();
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const now = Date.now();
    const lease = JSON.parse(localStorage.getItem(REFRESH_LEASE) ?? "null") as { owner?: string; expires?: number } | null;
    if (!lease?.expires || lease.expires < now) {
      localStorage.setItem(REFRESH_LEASE, JSON.stringify({ owner, expires: now + 5_000 }));
      const confirmed = JSON.parse(localStorage.getItem(REFRESH_LEASE) ?? "null") as { owner?: string } | null;
      if (confirmed?.owner === owner) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  try {
    return await work();
  } finally {
    const lease = JSON.parse(localStorage.getItem(REFRESH_LEASE) ?? "null") as { owner?: string } | null;
    if (lease?.owner === owner) localStorage.removeItem(REFRESH_LEASE);
  }
}

export function refreshSessionSingleFlight(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = withLease(rotateSession).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await directFetch(path, init);
  const normalized = buildApiPath(path);
  if (response.status !== 401 || normalized.startsWith("/api/auth/") || init.headers instanceof Headers && init.headers.has("Authorization")) {
    return response;
  }
  if (!(await refreshSessionSingleFlight())) {
    emitSessionExpired();
    return response;
  }
  return directFetch(path, init);
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`API ${response.status}${body ? ` - ${body}` : ""}`);
  }
  return response.json() as Promise<T>;
}
