const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type UserRole = "admin" | "treinador" | "auxiliar" | "user";

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthMeResponse = {
  user_id: string;
  role: UserRole;
  jogador_id: number | null;
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

export async function loginAuth(username: string, password: string): Promise<AuthTokenResponse> {
  const resp = await fetch(buildUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }

  return await resp.json();
}

export async function getCurrentUser(token?: string): Promise<AuthMeResponse> {
  const resp = await fetch(buildUrl("/api/auth/me"), {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }

  return await resp.json();
}
