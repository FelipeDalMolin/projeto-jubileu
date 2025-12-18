// src/services/diasService.ts
import type {
  Dia,
  AulaDia,
  PresencaJogadorDia,
  TimeDia,
  StatusAula,
  TipoEventoAula,
} from "../types/dia";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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

// -------------------------
// MAPPERS (backend -> frontend)
// -------------------------

function mapPresencaJogador(j: any): PresencaJogadorDia {
  const jogadorId = j.jogadorId ?? j.jogador_id ?? j.id;
  return {
    jogadorId: jogadorId != null ? Number(jogadorId) : 0,
    nome: j.nome ?? "",
    status: j.status,
    timeId: j.timeId ?? (j.time_id != null ? String(j.time_id) : undefined),
  };
}

function mapTime(t: any): TimeDia {
  const jogadoresIdsRaw = t.jogadoresIds ?? t.jogadores_ids ?? [];
  return {
    id: String(t.id),
    nome: t.nome ?? "",
    jogadoresIds: (jogadoresIdsRaw ?? []).map((id: any) => Number(id)),
    caracteristica: t.caracteristica ?? undefined,
    corCamisa: t.corCamisa ?? t.cor_camisa ?? undefined,
  };
}

function mapAula(aula: any): AulaDia {
  const jogadores: PresencaJogadorDia[] = (aula.jogadores ?? []).map(
    mapPresencaJogador,
  );
  const times: TimeDia[] = (aula.times ?? []).map(mapTime);

  return {
    id: String(aula.id),
    // backend agora: turma_id é int
    turmaId: aula.turma_id != null ? Number(aula.turma_id) : 0,
    turmaNome: aula.turma_nome ?? aula.turma?.nome ?? "",
    numeroAulaNaTurma: aula.numero_aula_na_turma ?? 1,
    tipo: aula.tipo,
    horarioInicio: aula.horario_inicio,
    horarioFim: aula.horario_fim,
    status: aula.status,
    jogadores,
    times,
    partidasCount: (aula.partidas ?? []).length,
  };
}

function mapDia(data: any): Dia {
  const feriadoNome = data.feriado_nome ?? data.feriado?.nome;
  const feriadoTipo = data.feriado_tipo ?? data.feriado?.tipo;
  return {
    dataIso: data.data_iso,
    aulas: (data.aulas ?? []).map(mapAula),
    feriado:
      feriadoNome && feriadoTipo
        ? { nome: feriadoNome, tipo: feriadoTipo }
        : null,
  };
}

// -------------------------
// MAPPERS (frontend -> backend)
// -------------------------

function toBackendPresenca(j: PresencaJogadorDia): any {
  return {
    jogadorId: j.jogadorId,
    nome: j.nome,
    status: j.status,
    timeId: j.timeId ?? null,
    atributos: {
      gols: 0,
      assistencias: 0,
      defesas: 0,
      chiliques: 0,
      faltas: 0,
    },
  };
}

function toBackendTime(t: TimeDia): any {
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

export function ordenarAulasPorHorario(aulas: AulaDia[]): AulaDia[] {
  return [...aulas].sort((a, b) =>
    (a.horarioInicio ?? "").localeCompare(b.horarioInicio ?? ""),
  );
}

// -------------------------
// SERVICES
// -------------------------

export async function listarDias(): Promise<Dia[]> {
  const resp = await fetch(url("/dias"));
  if (!resp.ok) {
    throw new Error(`Erro ao listar dias: ${resp.status} ${await safeText(resp)}`);
  }
  const json = await resp.json();
  const dias = (json ?? []).map(mapDia) as Dia[];
  return dias.sort((a, b) => a.dataIso.localeCompare(b.dataIso));
}

export async function obterDiaPorData(dataIso: string): Promise<Dia> {
  const resp = await fetch(url(`/dias/${dataIso}`));
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
 * Input do front. Repare que turmaId é number.
 * (turmaNome é opcional; idealmente o backend resolve pelo FK)
 */
export type NovaAulaInput = {
  turmaId: number;
  tipo?: TipoEventoAula;
  horarioInicio: string;
  horarioFim: string;
  status?: StatusAula;
};

export async function criarAulaNoDia(
  dataIso: string,
  nova: NovaAulaInput,
): Promise<AulaDia> {
  const payload = {
    turma_id: nova.turmaId, // <<<<< INT
    tipo: nova.tipo ?? "AULA",
    horario_inicio: nova.horarioInicio,
    horario_fim: nova.horarioFim,
    status: nova.status ?? "PLANEJADA",
  };

  const resp = await fetch(url(`/dias/${dataIso}/aulas`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao criar aula em ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  return mapAula(await resp.json());
}

export async function deletarAulaNoDia(dataIso: string, aulaId: string): Promise<void> {
  const resp = await fetch(url(`/dias/${dataIso}/aulas/${aulaId}`), {
    method: "DELETE",
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao excluir aula ${aulaId} em ${dataIso}: ${resp.status} ${await safeText(resp)}`,
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

export async function criarTimeNaAula(
  dataIso: string,
  aulaId: string,
  novo: NovoTimeInput,
): Promise<TimeDia> {
  const payload = {
    nome: novo.nome,
    caracteristica: novo.caracteristica ?? null,
    cor_camisa: novo.corCamisa ?? null,
  };

  const resp = await fetch(url(`/dias/${dataIso}/aulas/${aulaId}/times`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao criar time na aula ${aulaId} do dia ${dataIso}: ${resp.status} ${await safeText(resp)}`,
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

export async function carregarEstadoEquipesAula(
  dataIso: string,
  aulaId: string,
): Promise<EstadoEquipesSnapshot | null> {
  const resp = await fetch(url(`/dias/${dataIso}/aulas/${aulaId}/estado-equipes`));

  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(
      `Erro ao carregar estado de equipes da aula ${aulaId} do dia ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const json = await resp.json();
  return {
    jogadores: (json.jogadores ?? []).map(mapPresencaJogador),
    times: (json.times ?? []).map(mapTime),
  };
}

export async function salvarEstadoEquipesAula(
  dataIso: string,
  aulaId: string,
  jogadores: PresencaJogadorDia[],
  times: TimeDia[],
): Promise<void> {
  const payload = {
    jogadores: jogadores.map(toBackendPresenca),
    times: times.map(toBackendTime),
  };

  const resp = await fetch(url(`/dias/${dataIso}/aulas/${aulaId}/estado-equipes`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error(
      `Erro ao salvar estado de equipes da aula ${aulaId} do dia ${dataIso}: ${resp.status} ${await safeText(resp)}`,
    );
  }
}
