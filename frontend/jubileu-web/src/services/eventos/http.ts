const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type AuthHeaders = {
  userId: string;
  role?: "admin" | "treinador" | "auxiliar" | "user";
  jogadorId?: number;
  accessToken?: string | null;
};

const forcedLegacyUsers = new Set<string>();

function isJwtExpired(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return false;
    const decoded = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    if (!decoded.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp <= now;
  } catch {
    return false;
  }
}

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

function toNetworkError(err: unknown): Error {
  if (err instanceof Error && err.name === "TypeError") {
    return new Error("Falha de rede ao chamar API. Verifique backend/proxy/CORS.");
  }
  return err instanceof Error ? err : new Error("Erro inesperado de rede");
}

export function buildAuthHeaders(auth: AuthHeaders): HeadersInit {
  const useBearer =
    Boolean(auth.accessToken) &&
    !isJwtExpired(auth.accessToken!) &&
    !forcedLegacyUsers.has(auth.userId);
  return {
    ...(useBearer ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    "X-User-Id": auth.userId,
    "X-Role": auth.role ?? "user",
    ...(auth.jogadorId != null ? { "X-Jogador-Id": String(auth.jogadorId) } : {}),
  };
}

function buildLegacyOnlyHeaders(auth: AuthHeaders): HeadersInit {
  return {
    "X-User-Id": auth.userId,
    "X-Role": auth.role ?? "user",
    ...(auth.jogadorId != null ? { "X-Jogador-Id": String(auth.jogadorId) } : {}),
  };
}

function shouldRetryWithLegacy(resp: Response, auth: AuthHeaders): boolean {
  if (resp.status !== 401 || !auth.accessToken) return false;
  forcedLegacyUsers.add(auth.userId);
  return true;
}

export async function postJson<T>(
  path: string,
  auth: AuthHeaders,
  body?: unknown,
  extraHeaders?: HeadersInit,
): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(buildUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(auth),
        ...(extraHeaders ?? {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (err: unknown) {
    throw toNetworkError(err);
  }
  if (shouldRetryWithLegacy(resp, auth)) {
    try {
      resp = await fetch(buildUrl(path), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildLegacyOnlyHeaders(auth),
          ...(extraHeaders ?? {}),
        },
        body: body != null ? JSON.stringify(body) : undefined,
      });
    } catch (err: unknown) {
      throw toNetworkError(err);
    }
  }
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

export async function getJson<T>(path: string, auth: AuthHeaders): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(buildUrl(path), {
      method: "GET",
      headers: buildAuthHeaders(auth),
    });
  } catch (err: unknown) {
    throw toNetworkError(err);
  }
  if (shouldRetryWithLegacy(resp, auth)) {
    try {
      resp = await fetch(buildUrl(path), {
        method: "GET",
        headers: buildLegacyOnlyHeaders(auth),
      });
    } catch (err: unknown) {
      throw toNetworkError(err);
    }
  }
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

export async function deleteJson<T>(path: string, auth: AuthHeaders): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(buildUrl(path), {
      method: "DELETE",
      headers: buildAuthHeaders(auth),
    });
  } catch (err: unknown) {
    throw toNetworkError(err);
  }
  if (shouldRetryWithLegacy(resp, auth)) {
    try {
      resp = await fetch(buildUrl(path), {
        method: "DELETE",
        headers: buildLegacyOnlyHeaders(auth),
      });
    } catch (err: unknown) {
      throw toNetworkError(err);
    }
  }
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

export async function patchJson<T>(
  path: string,
  auth: AuthHeaders,
  body?: unknown,
  extraHeaders?: HeadersInit,
): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(buildUrl(path), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(auth),
        ...(extraHeaders ?? {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (err: unknown) {
    throw toNetworkError(err);
  }
  if (shouldRetryWithLegacy(resp, auth)) {
    try {
      resp = await fetch(buildUrl(path), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildLegacyOnlyHeaders(auth),
          ...(extraHeaders ?? {}),
        },
        body: body != null ? JSON.stringify(body) : undefined,
      });
    } catch (err: unknown) {
      throw toNetworkError(err);
    }
  }
  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}
