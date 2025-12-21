import type {
  EstatisticaJogadorPartida,
  PartidaAula,
} from "../types/dia";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function url(path: string) {
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

function mapEstatistica(api: any): EstatisticaJogadorPartida {
  return {
    id: api.id,
    jogadorAulaId: Number(api.jogador_aula_id ?? api.jogadorAulaId ?? api.jogadorId ?? 0),
    gols: Number(api.gols ?? 0),
    assistencias: Number(api.assistencias ?? 0),
    defesas: Number(api.defesas ?? 0),
    chiliques: Number(api.chiliques ?? 0),
    faltas: Number(api.faltas ?? 0),
    nota: api.nota != null ? Number(api.nota) : undefined,
  };
}

function mapPartida(api: any): PartidaAula {
  return {
    id: Number(api.id),
    ordem: Number(api.ordem ?? 0),
    timeAId: String(api.time_a_id ?? api.timeAId ?? ""),
    timeBId: String(api.time_b_id ?? api.timeBId ?? ""),
    golsTimeA: Number(api.gols_time_a ?? api.golsTimeA ?? 0),
    golsTimeB: Number(api.gols_time_b ?? api.golsTimeB ?? 0),
    estatisticas: (api.estatisticas ?? []).map(mapEstatistica),
  };
}

type PartidaInput = {
  ordem?: number;
  timeAId: string;
  timeBId: string;
  estatisticas?: EstatisticaJogadorPartida[];
};

function parseTimeId(raw: string): number {
  const cleaned = raw.startsWith("time-") ? raw.slice(5) : raw;
  return Number(cleaned);
}

function toPayload(input: PartidaInput) {
  return {
    ordem: input.ordem,
    time_a_id: parseTimeId(input.timeAId),
    time_b_id: parseTimeId(input.timeBId),
    estatisticas: (input.estatisticas ?? []).map((e) => ({
      jogador_aula_id: e.jogadorAulaId,
      gols: e.gols ?? 0,
      assistencias: e.assistencias ?? 0,
      defesas: e.defesas ?? 0,
      chiliques: e.chiliques ?? 0,
      faltas: e.faltas ?? 0,
      nota: e.nota ?? null,
    })),
  };
}

export async function listarPartidas(
  dataIso: string,
  aulaId: string,
): Promise<PartidaAula[]> {
  const resp = await fetch(url(`/dias/${dataIso}/aulas/${aulaId}/partidas`));
  if (!resp.ok) {
    throw new Error(
      `Erro ao listar partidas: ${resp.status} ${await safeText(resp)}`,
    );
  }
  const json = await resp.json();
  return (json ?? []).map(mapPartida);
}

export async function criarPartida(
  dataIso: string,
  aulaId: string,
  input: PartidaInput,
): Promise<PartidaAula> {
  const resp = await fetch(url(`/dias/${dataIso}/aulas/${aulaId}/partidas`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(input)),
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao criar partida: ${resp.status} ${await safeText(resp)}`,
    );
  }

  return mapPartida(await resp.json());
}

export async function atualizarPartida(
  dataIso: string,
  aulaId: string,
  partidaId: string,
  input: PartidaInput,
): Promise<PartidaAula> {
  const resp = await fetch(
    url(`/dias/${dataIso}/aulas/${aulaId}/partidas/${partidaId}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(input)),
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao atualizar partida: ${resp.status} ${await safeText(resp)}`,
    );
  }

  return mapPartida(await resp.json());
}

export async function deletarPartida(
  dataIso: string,
  aulaId: string,
  partidaId: string,
): Promise<void> {
  const resp = await fetch(
    url(`/dias/${dataIso}/aulas/${aulaId}/partidas/${partidaId}`),
    { method: "DELETE" },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao excluir partida: ${resp.status} ${await safeText(resp)}`,
    );
  }
}
