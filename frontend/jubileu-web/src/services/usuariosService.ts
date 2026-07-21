import type { RequestAuth } from "../context/AuthContext";
import type { EventoStatus, EventoTipo, EventoParticipanteStatus } from "../types/evento";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type UsuarioMeResponse = {
  usuario: {
    user_id: string;
    username: string;
    display_name: string;
    email?: string | null;
    role: string;
    jogador_id?: number | null;
  };
  jogador?: {
    id: number;
    nome: string;
    apelido?: string | null;
    status?: string | null;
  } | null;
  eventos: Array<{
    evento_id: number;
    data_iso: string;
    tipo: EventoTipo;
    status: EventoStatus;
    horario_inicio: string;
    horario_fim: string;
    turma_id: number;
    turma_nome: string;
    participante_status?: EventoParticipanteStatus | null;
  }>;
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

function authHeaders(auth: RequestAuth): Record<string, string> {
  if (auth.accessToken) {
    return { Authorization: `Bearer ${auth.accessToken}` };
  }
  const headers: Record<string, string> = {
    "X-User-Id": auth.userId,
    "X-Role": auth.role,
  };
  if (auth.jogadorId != null) {
    headers["X-Jogador-Id"] = String(auth.jogadorId);
  }
  return headers;
}

export async function obterUsuarioMe(auth: RequestAuth): Promise<UsuarioMeResponse> {
  const resp = await fetch(buildUrl("/api/usuarios/me"), {
    headers: authHeaders(auth),
  });
  if (!resp.ok) {
    throw new Error(`Erro ao carregar usuario: ${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

export async function atualizarUsuarioJogador(
  auth: RequestAuth,
  jogadorId: number | null,
): Promise<UsuarioMeResponse> {
  const resp = await fetch(buildUrl("/api/usuarios/me/jogador"), {
    method: "PUT",
    headers: {
      ...authHeaders(auth),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jogador_id: jogadorId }),
  });
  if (!resp.ok) {
    throw new Error(`Erro ao vincular jogador: ${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}
