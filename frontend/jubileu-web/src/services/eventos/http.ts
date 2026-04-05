const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type AuthHeaders = {
  userId: string;
  role?: "admin" | "treinador" | "auxiliar" | "user";
  jogadorId?: number;
  accessToken?: string | null;
};

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function safeText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

export function buildAuthHeaders(auth: AuthHeaders): HeadersInit {
  return {
    ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    "X-User-Id": auth.userId,
    "X-Role": auth.role ?? "user",
    ...(auth.jogadorId != null ? { "X-Jogador-Id": String(auth.jogadorId) } : {}),
  };
}

export async function postJson<T>(
  path: string,
  auth: AuthHeaders,
  body?: unknown,
  extraHeaders?: HeadersInit,
): Promise<T> {
  const resp = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(auth),
      ...(extraHeaders ?? {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

export async function getJson<T>(path: string, auth: AuthHeaders): Promise<T> {
  const resp = await fetch(buildUrl(path), {
    method: "GET",
    headers: buildAuthHeaders(auth),
  });
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

export async function deleteJson<T>(path: string, auth: AuthHeaders): Promise<T> {
  const resp = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: buildAuthHeaders(auth),
  });
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}
