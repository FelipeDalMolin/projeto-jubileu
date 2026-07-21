import type { RequestAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/apiClient";
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

export async function obterUsuarioMe(_auth: RequestAuth): Promise<UsuarioMeResponse> {
  void _auth;
  const resp = await apiFetch(buildUrl("/api/usuarios/me"));
  if (!resp.ok) {
    throw new Error(`Erro ao carregar usuario: ${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}

export async function atualizarUsuarioJogador(
  _auth: RequestAuth,
  jogadorId: number | null,
): Promise<UsuarioMeResponse> {
  void _auth;
  const resp = await apiFetch(buildUrl("/api/usuarios/me/jogador"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jogador_id: jogadorId }),
  });
  if (!resp.ok) {
    throw new Error(`Erro ao vincular jogador: ${resp.status} ${await safeText(resp)}`);
  }
  return await resp.json();
}
