const API_BASE_PATH = "/api";

function createRequestId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `jubileu-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildApiPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === API_BASE_PATH || normalizedPath.startsWith(`${API_BASE_PATH}/`)) {
    return normalizedPath;
  }
  return `${API_BASE_PATH}${normalizedPath}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("X-Request-ID")) {
    headers.set("X-Request-ID", createRequestId());
  }

  return fetch(buildApiPath(path), {
    ...init,
    headers,
  });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API ${response.status}${text ? ` - ${text}` : ""}`);
  }
  return response.json() as Promise<T>;
}
