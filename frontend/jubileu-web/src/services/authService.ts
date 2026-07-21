import { apiFetch, apiJson } from "../lib/apiClient";

export type UserRole = "admin" | "treinador" | "auxiliar" | "user";

export type AuthMeResponse = {
  user_id: string;
  username?: string | null;
  display_name?: string | null;
  email?: string | null;
  role: UserRole;
  jogador_id: number | null;
  expires_in?: number | null;
};

export function loginAuth(username: string, password: string): Promise<AuthMeResponse> {
  return apiJson<AuthMeResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function getCurrentUser(): Promise<AuthMeResponse> {
  return apiJson<AuthMeResponse>("/auth/me");
}

export async function logoutAuth(): Promise<void> {
  const response = await apiFetch("/auth/logout", { method: "POST" });
  if (!response.ok && response.status !== 401) throw new Error(`Logout ${response.status}`);
}
