import { apiFetch } from "../../lib/apiClient";

export type AuthHeaders = {
  userId: string;
  role?: "admin" | "treinador" | "auxiliar" | "user";
  jogadorId?: number;
};

async function safeText(response: Response) {
  try { return await response.text(); } catch { return ""; }
}

async function jsonRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await apiFetch(path, init);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TypeError") {
      throw new Error("Falha de rede ao chamar API. Verifique backend/proxy/CORS.");
    }
    throw error;
  }
  if (!response.ok) throw new Error(`${response.status} ${await safeText(response)}`);
  return response.json() as Promise<T>;
}

export function postJson<T>(path: string, _auth: AuthHeaders, body?: unknown, extraHeaders?: HeadersInit): Promise<T> {
  void _auth;
  return jsonRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export function getJson<T>(path: string, _auth: AuthHeaders): Promise<T> {
  void _auth;
  return jsonRequest(path, { method: "GET" });
}

export function deleteJson<T>(path: string, _auth: AuthHeaders): Promise<T> {
  void _auth;
  return jsonRequest(path, { method: "DELETE" });
}

export function patchJson<T>(path: string, _auth: AuthHeaders, body?: unknown, extraHeaders?: HeadersInit): Promise<T> {
  void _auth;
  return jsonRequest(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
    body: body == null ? undefined : JSON.stringify(body),
  });
}
