// src/services/diasService.ts
import type {
  Dia,
  EventoDia,
  PresencaJogadorDia,
  TimeDia,
  StatusEvento,
  TipoEventoModo,
  FeriadoInfo,
} from "../types/dia";
import type { EstatisticaJogadorPartida } from "../types/dia";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Normaliza URL final sem duplicar barras.
 */
function url(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Lê corpo de erro (texto) sem explodir.
 */
async function safeText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

type ApiRecord = Record<string, unknown>;

type BackendPresenca = {
  jogadorId: number;
  nome: string;
  status: string;
  timeId: string | null;
  atributos: {
    gols: number;
    assistencias: number;
    chiliques: number;
    faltas: number;
  };
};

type BackendTime = {
  id: string;
  nome: string;
  jogadoresIds: number[];
  caracteristica: string | null;
  corCamisa: string | null;
};

function asRecord(value: unknown): ApiRecord {
  return typeof value === "object" && value !== null ? (value as ApiRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return fallback;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return undefined;
}

function mapStatusPresenca(value: unknown): PresencaJogadorDia["status"] {
  if (
    value === "presente" ||
    value === "faltou" ||
    value === "atestado" ||
    value === "coringa" ||
    value === "so_treino"
  ) {
    return value;
  }
  return "presente";
}

function mapStatusEvento(value: unknown): StatusEvento {
  if (value === "EM_ANDAMENTO" || value === "ENCERRADO" || value === "CANCELADO") return value;
  return "PLANEJADO";
}

function mapTipoEventoModo(value: unknown): TipoEventoModo {
  if (value === "JOGO_LIVRE" || value === "OUTRO") return value;
  return "AULA";
}

function mapFeriadoTipo(value: unknown): FeriadoInfo["tipo"] | null {
  if (value === "NACIONAL" || value === "ESTADUAL" || value === "MUNICIPAL" || value === "CLUBE") {
    return value;
  }
  return null;
}

function mapPartidaStatus(value: unknown): PartidaPersistida["status"] {
  if (value === "EM_ANDAMENTO" || value === "ENCERRADA") return value;
  return "PLANEJADA";
}

function mapEstatisticaJogadorPartida(raw: unknown): EstatisticaJogadorPartida {
  const e = asRecord(raw);
  return {
    id: e.id != null ? asNumber(e.id) : undefined,
    jogadorEventoId: asNumber(e.jogador_evento_id ?? e.jogadorEventoId),
    gols: asNumber(e.gols),
    assistencias: asNumber(e.assistencias),
    chiliques: asNumber(e.chiliques),
    faltas: asNumber(e.faltas),
    nota: e.nota != null ? asNumber(e.nota) : undefined,
  };
}

// -------------------------
// MAPPERS (backend -> frontend)
// -------------------------

function mapPresencaJogador(raw: unknown): PresencaJogadorDia {
  const j = asRecord(raw);
  const jogadorId = j.jogadorId ?? j.jogador_id ?? j.id;
  return {
    jogadorId: jogadorId != null ? asNumber(jogadorId) : 0,
    nome: asString(j.nome),
    status: mapStatusPresenca(j.status),
    timeId: asOptionalString(j.timeId) ?? (j.time_id != null ? String(j.time_id) : undefined),
  };
}

function mapTime(raw: unknown): TimeDia {
  const t = asRecord(raw);
  const jogadoresIdsRaw = t.jogadoresIds ?? t.jogadores_ids ?? [];
  return {
    id: String(t.id),
    nome: asString(t.nome),
    jogadoresIds: asArray(jogadoresIdsRaw).map((id) => Number(id)),
    caracteristica: asOptionalString(t.caracteristica),
    corCamisa: asOptionalString(t.corCamisa) ?? asOptionalString(t.cor_camisa),
  };
}

function mapEvento(raw: unknown): EventoDia {
  const evento = asRecord(raw);
  const jogadores: PresencaJogadorDia[] = asArray(evento.jogadores).map(mapPresencaJogador);
  const times: TimeDia[] = asArray(evento.times).map(mapTime);

  return {
    id: String(evento.id),
    turmaId: evento.turma_id != null ? asNumber(evento.turma_id) : null,
    turmaNome: evento.turma_nome != null ? asString(evento.turma_nome) : null,
    numeroEventoNaTurma:
      evento.numero_evento_na_turma != null ? asNumber(evento.numero_evento_na_turma) : null,
    tipo: mapTipoEventoModo(evento.tipo),
    horarioInicio: asString(evento.horario_inicio),
    horarioFim: asString(evento.horario_fim),
    status: mapStatusEvento(evento.status),
    jogadores,
    times,
    partidasCount: asArray(evento.partidas).length,
  };
}

function mapDia(raw: unknown): Dia {
  const data = asRecord(raw);
  const feriado = asRecord(data.feriado);
  const feriadoNome = asOptionalString(data.feriado_nome ?? feriado.nome);
  const feriadoTipo = mapFeriadoTipo(data.feriado_tipo ?? feriado.tipo);
  return {
    dataIso: asString(data.data_iso),
    eventos: asArray(data.eventos).map(mapEvento),
    feriado:
      feriadoNome && feriadoTipo
        ? { nome: feriadoNome, tipo: feriadoTipo }
        : null,
  };
}

// -------------------------
// MAPPERS (frontend -> backend)
// -------------------------

function toBackendPresenca(j: PresencaJogadorDia): BackendPresenca {
  return {
    jogadorId: j.jogadorId,
    nome: j.nome,
    status: j.status,
    timeId: j.timeId ?? null,
    atributos: {
      gols: 0,
      assistencias: 0,
      chiliques: 0,
      faltas: 0,
    },
  };
}

function toBackendTime(t: TimeDia): BackendTime {
  return {
    id: t.id,
    nome: t.nome,
    jogadoresIds: t.jogadoresIds ?? [],
    caracteristica: t.caracteristica ?? null,
    corCamisa: t.corCamisa ?? null,
  };
}

// -------------------------
// HELPERS
// -------------------------

export function ordenarEventosPorHorario(eventos: EventoDia[]): EventoDia[] {
  return [...eventos].sort((a, b) =>
    (a.horarioInicio ?? "").localeCompare(b.horarioInicio ?? ""),
  );
}

// -------------------------
// SERVICES
// -------------------------

export async function listarDias(): Promise<Dia[]> {
  const resp = await fetch(url("/api/dias/"));
  if (!resp.ok) {
    throw new Error(`Erro ao listar dias: ${resp.status} ${await safeText(resp)}`);
  }
  const json = await resp.json();
  const dias = (json ?? []).map(mapDia) as Dia[];
  return dias.sort((a, b) => a.dataIso.localeCompare(b.dataIso));
}

export async function obterDiaPorData(dataIso: string): Promise<Dia> {
  const resp = await fetch(url(`/api/dias/${dataIso}`));
  if (!resp.ok) {
    throw new Error(
      `Erro ao buscar dia ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }
  return mapDia(await resp.json());
}

// -------------------------
// CRIAR AULA
// -------------------------

/**
 * Input do front. turmaId e obrigatorio somente para eventos AULA.
 */
export type NovaEventoInput = {
  turmaId?: number | null;
  tipo?: TipoEventoModo;
  horarioInicio: string;
  horarioFim: string;
  status?: StatusEvento;
};

export async function criarEventoNoDia(
  dataIso: string,
  nova: NovaEventoInput,
): Promise<EventoDia> {
  const tipo = nova.tipo ?? "AULA";
  const payload = {
    ...(tipo === "AULA" ? { turma_id: nova.turmaId } : {}),
    tipo,
    horario_inicio: nova.horarioInicio,
    horario_fim: nova.horarioFim,
    status: nova.status ?? "PLANEJADO",
  };

  const resp = await fetch(url(`/api/dias/${dataIso}/eventos`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao criar evento em ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  return mapEvento(await resp.json());
}

export async function deletarEventoNoDia(dataIso: string, eventoId: string): Promise<void> {
  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}`), {
    method: "DELETE",
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao excluir evento ${eventoId} em ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }
}

// -------------------------
// TIMES DA AULA
// -------------------------

export type NovoTimeInput = {
  nome: string;
  caracteristica?: string;
  corCamisa?: string;
};

export async function criarTimeNoEvento(
  dataIso: string,
  eventoId: string,
  novo: NovoTimeInput,
): Promise<TimeDia> {
  const payload = {
    nome: novo.nome,
    caracteristica: novo.caracteristica ?? null,
    cor_camisa: novo.corCamisa ?? null,
  };

  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/times`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao criar time na evento ${eventoId} do dia ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const json = await resp.json();
  return {
    id: String(json.id),
    nome: json.nome,
    jogadoresIds: [],
    caracteristica: json.caracteristica ?? undefined,
    corCamisa: json.cor_camisa ?? undefined,
  };
}

// -------------------------
// ESTADO DE EQUIPES (SNAPSHOT JSON)
// -------------------------

export type EstadoEquipesSnapshot = {
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
};

export type PartidaPersistida = {
  id: string;
  ordem: number;
  status: "PLANEJADA" | "EM_ANDAMENTO" | "ENCERRADA";
  timeAId: string;
  timeBId: string;
  golsTimeA: number;
  golsTimeB: number;
  estatisticas?: EstatisticaJogadorPartida[];
};

export async function moverJogadorNoEvento(
  dataIso: string,
  eventoId: string | number,
  jogadorEventoId: number,
  novoTimeId: string | null,
): Promise<{ version?: number }> {
  const payload = {
    time_id: novoTimeId != null ? Number(novoTimeId) : null,
  };

  const resp = await fetch(
    url(`/api/dias/${dataIso}/eventos/${eventoId}/jogadores/${jogadorEventoId}/time`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao mover jogador ${jogadorEventoId} na evento ${eventoId}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data = await resp.json();
  return { version: data?.version };
}

export async function atualizarStatusJogadorNoEvento(
  dataIso: string,
  eventoId: string | number,
  jogadorEventoId: number,
  status: string,
): Promise<{ version?: number }> {
  const payload = { status };

  const resp = await fetch(
    url(`/api/dias/${dataIso}/eventos/${eventoId}/jogadores/${jogadorEventoId}/status`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao atualizar status do jogador ${jogadorEventoId} na evento ${eventoId}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data = await resp.json();
  return { version: data?.version };
}

export async function deletarTimeNoEvento(
  dataIso: string,
  eventoId: string | number,
  timeId: string | number,
): Promise<void> {
  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/times/${timeId}`), {
    method: "DELETE",
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao deletar time ${timeId} da evento ${eventoId}: ${resp.status} ${await safeText(resp)}`,
    );
  }
}

export async function criarPartidaNoEvento(
  dataIso: string,
  eventoId: string | number,
  payload: { ordem?: number; timeAId: string | number; timeBId: string | number },
): Promise<PartidaPersistida> {
  const body = {
    ordem: payload.ordem ?? null,
    timeAId: Number(payload.timeAId),
    timeBId: Number(payload.timeBId),
  };

  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/partidas`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao criar partida na evento ${eventoId}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const json = asRecord(await resp.json());
  return {
    id: String(json.id),
    ordem: asNumber(json.ordem),
    status: mapPartidaStatus(json.status),
    timeAId: String(json.timeAId ?? json.time_a_id),
    timeBId: String(json.timeBId ?? json.time_b_id),
    golsTimeA: asNumber(json.golsTimeA ?? json.gols_time_a),
    golsTimeB: asNumber(json.golsTimeB ?? json.gols_time_b),
    estatisticas: asArray(json.estatisticas).map(mapEstatisticaJogadorPartida),
  };
}

export async function iniciarPartidaNoEvento(
  dataIso: string,
  eventoId: string | number,
  partidaId: string | number,
): Promise<{ version?: number }> {
  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/partidas/${partidaId}/start`), {
    method: "PUT",
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao iniciar partida ${partidaId} da evento ${eventoId}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data = await resp.json();
  return { version: data?.version };
}

export async function encerrarPartidaNoEvento(
  dataIso: string,
  eventoId: string | number,
  partidaId: string | number,
): Promise<{ version?: number }> {
  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/partidas/${partidaId}/end`), {
    method: "PUT",
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao encerrar partida ${partidaId} da evento ${eventoId}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data = await resp.json();
  return { version: data?.version };
}

export async function removerPartidaDoEvento(
  dataIso: string,
  eventoId: string | number,
  partidaId: string | number,
): Promise<void> {
  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/partidas/${partidaId}`), {
    method: "DELETE",
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao remover partida ${partidaId} da evento ${eventoId}: ${resp.status} ${await safeText(resp)}`,
    );
  }
}

export async function atualizarStatsJogadorPartida(
  dataIso: string,
  eventoId: string | number,
  partidaId: string | number,
  jogadorEventoId: number,
  stats: { gols: number; assistencias: number; chiliques: number; faltas: number },
): Promise<{ version?: number }> {
  const resp = await fetch(
    url(
      `/api/dias/${dataIso}/eventos/${eventoId}/partidas/${partidaId}/jogadores/${jogadorEventoId}/stats`,
    ),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stats),
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao atualizar stats do jogador ${jogadorEventoId} na partida ${partidaId}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data = await resp.json();
  return { version: data?.version };
}

export async function carregarEstadoEquipesEvento(
  dataIso: string,
  eventoId: string,
): Promise<EstadoEquipesSnapshot | null> {
  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/estado-equipes`));

  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(
      `Erro ao carregar estado de equipes da evento ${eventoId} do dia ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const json = await resp.json();
  return {
    jogadores: (json.jogadores ?? []).map(mapPresencaJogador),
    times: (json.times ?? []).map(mapTime),
  };
}

export async function salvarEstadoEquipesEvento(
  dataIso: string,
  eventoId: string | number,
  jogadores: PresencaJogadorDia[],
  times: TimeDia[],
  expectedVersion?: number | null,
): Promise<{ version?: number }> {
  const payload = {
    jogadores: jogadores.map(toBackendPresenca),
    times: times.map(toBackendTime),
    ...(expectedVersion != null ? { expected_version: expectedVersion } : {}),
  };

  const resp = await fetch(url(`/api/dias/${dataIso}/eventos/${eventoId}/estado-equipes`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  

  if (!resp.ok) {
    throw new Error(
      `Erro ao salvar estado de equipes da evento ${eventoId} do dia ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data = await resp.json();
  return { version: data?.version };
}
