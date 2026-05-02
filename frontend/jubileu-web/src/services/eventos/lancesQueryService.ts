import type { Lance } from "../../types/evento";
import type { LanceTimelineItem } from "../../types/lanceTimeline";
import { getJson, type AuthHeaders } from "./http";

export async function listarLancesEvento(
  eventoId: number,
  auth: AuthHeaders,
  params?: {
    partidaId?: number;
    since?: string;
    limit?: number;
  },
): Promise<Lance[]> {
  const search = new URLSearchParams();
  if (params?.partidaId != null) search.set("partida_id", String(params.partidaId));
  if (params?.since) search.set("since", params.since);
  if (params?.limit) search.set("limit", String(params.limit));
  const suffix = search.toString() ? `?${search}` : "";
  const data = await getJson<{ items: Lance[] }>(`/api/eventos/${eventoId}/lances${suffix}`, auth);
  return data.items ?? [];
}

function inferSecondary(payload: Record<string, unknown>): {
  jogadorId: number | null;
  jogadorNome: string | null;
} {
  const idCandidate =
    payload.jogador_secundario_id ??
    payload.jogador2_id ??
    payload.assist_jogador_id ??
    payload.assistente_id;
  const nomeCandidate =
    payload.jogador_secundario_nome ??
    payload.jogador2_nome ??
    payload.assist_jogador_nome ??
    payload.assistente_nome;
  const jogadorId =
    typeof idCandidate === "number"
      ? idCandidate
      : typeof idCandidate === "string" && Number.isFinite(Number(idCandidate))
        ? Number(idCandidate)
        : null;
  const jogadorNome = typeof nomeCandidate === "string" ? nomeCandidate : null;
  return { jogadorId, jogadorNome };
}

function inferMinute(payload: Record<string, unknown>): number | null {
  const candidate = payload.minute ?? payload.minuto;
  return typeof candidate === "number"
    ? candidate
    : typeof candidate === "string" && Number.isFinite(Number(candidate))
      ? Number(candidate)
      : null;
}

function inferTimeId(payload: Record<string, unknown>): number | null {
  const candidate = payload.time_id ?? payload.timeId;
  return typeof candidate === "number"
    ? candidate
    : typeof candidate === "string" && Number.isFinite(Number(candidate))
      ? Number(candidate)
      : null;
}

export function mapLanceToTimelineItem(lance: Lance): LanceTimelineItem {
  const payload = lance.payload ?? {};
  const secondary = inferSecondary(payload);

  return {
    id: lance.id,
    eventoId: lance.evento_id,
    partidaId: lance.partida_id,
    tipo: lance.tipo,
    timeId: lance.time_id ?? inferTimeId(payload),
    timeNome: lance.time_nome ?? null,
    jogadorPrincipalId: lance.jogador_id ?? null,
    jogadorPrincipalNome: lance.jogador_nome ?? null,
    jogadorSecundarioId: secondary.jogadorId,
    jogadorSecundarioNome: secondary.jogadorNome,
    author: lance.created_by_user_id ?? null,
    minute: inferMinute(payload),
    createdAt: lance.created_at,
    payload,
  };
}
