import { apiFetch } from "../lib/apiClient";

export type UserRole = "admin" | "treinador" | "auxiliar" | "user";

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthMeResponse = {
  user_id: string;
  username?: string | null;
  display_name?: string | null;
  email?: string | null;
  role: UserRole;
  jogador_id: number | null;
};

async function safeText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

export async function loginAuth(
  username: string,
  password: string,
): Promise<AuthTokenResponse> {
  const resp = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }

  return await resp.json();
}

export async function getAuthMe(token: string): Promise<AuthMeResponse> {
  const resp = await apiFetch("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`${resp.status} ${await safeText(resp)}`);
  }

  return await resp.json();
}

export const getCurrentUser = getAuthMe;
