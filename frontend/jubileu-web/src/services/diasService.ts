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
  import.meta.env.VITE_API_BASE_URL ?? "/api";

// --- MAPPERS AUXILIARES (backend -> frontend) ---

function mapPresencaJogador(j: any): PresencaJogadorDia {
  return {
    jogadorId: j.jogador_id ?? j.id,
    nome: j.nome,
    status: j.status,
    timeId: j.time_id != null ? String(j.time_id) : undefined,
  };
}

function mapTime(t: any): TimeDia {
  return {
    id: String(t.id),
    nome: t.nome,
    jogadoresIds: [], // ainda não recebemos isso do backend
  };
}

function mapAula(aula: any): AulaDia {
  const jogadores: PresencaJogadorDia[] = (aula.jogadores ?? []).map(
    mapPresencaJogador,
  );
  const times: TimeDia[] = (aula.times ?? []).map(mapTime);

  return {
    id: String(aula.id),
    turmaId: aula.turma_id,
    turmaNome: aula.turma_nome,
    numeroAulaNaTurma: aula.numero_aula_na_turma,
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
  return {
    dataIso: data.data_iso,
    aulas: (data.aulas ?? []).map(mapAula),
    feriado: undefined,
  };
}

// --- MAPPERS AUXILIARES (frontend -> backend) ---

function toBackendPresenca(j: PresencaJogadorDia): any {
  return {
    id: j.jogadorId,
    jogador_id: j.jogadorId,
    nome: j.nome,
    status: j.status,
    time_id: j.timeId != null ? Number(j.timeId) : null,
    // ainda não usamos atributos no front; mandamos zerado
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
    id: isNaN(Number(t.id)) ? undefined : Number(t.id),
    nome: t.nome,
    caracteristica: null,
    cor_camisa: null,
  };
}

// --- SERVICES ---

export async function obterDiaPorData(dataIso: string): Promise<Dia> {
  const resp = await fetch(`${API_BASE_URL}/dias/${dataIso}`);

  if (!resp.ok) {
    throw new Error(`Erro ao buscar dia ${dataIso}: ${resp.status}`);
  }

  const json = await resp.json();
  return mapDia(json);
}

// (ainda mockado em cima de obterDiaPorData; depois teremos GET /dias)
export async function listarDias(): Promise<Dia[]> {
  const datas = ["2025-11-20", "2025-11-21"];

  const dias = await Promise.all(datas.map(obterDiaPorData));

  return dias.sort((a, b) => a.dataIso.localeCompare(b.dataIso));
}

export function ordenarAulasPorHorario(aulas: AulaDia[]): AulaDia[] {
  return [...aulas].sort((a, b) =>
    a.horarioInicio.localeCompare(b.horarioInicio),
  );
}

// --- CRIAR AULA ---

export type NovaAulaInput = {
  turmaId: string;
  turmaNome: string;
  numeroAulaNaTurma: number;
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
    turma_id: nova.turmaId,
    turma_nome: nova.turmaNome,
    numero_aula_na_turma: nova.numeroAulaNaTurma,
    tipo: nova.tipo ?? "AULA",
    horario_inicio: nova.horarioInicio,
    horario_fim: nova.horarioFim,
    status: nova.status ?? "PLANEJADA",
  };

  const resp = await fetch(`${API_BASE_URL}/dias/${dataIso}/aulas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => "");
    throw new Error(
      `Erro ao criar aula em ${dataIso}: ${resp.status} ${msg}`,
    );
  }

  const json = await resp.json();
  return mapAula(json);
}

// --- TIMES DA AULA ---

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

  const resp = await fetch(
    `${API_BASE_URL}/dias/${dataIso}/aulas/${aulaId}/times`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!resp.ok) {
    const msg = await resp.text().catch(() => "");
    throw new Error(
      `Erro ao criar time na aula ${aulaId} do dia ${dataIso}: ${resp.status} ${msg}`,
    );
  }

  const json = await resp.json();
  const time: TimeDia = {
    id: String(json.id),
    nome: json.nome,
    jogadoresIds: [],
  };
  return time;
}

// --- ESTADO DE EQUIPES (SNAPSHOT JSON) ---

export type EstadoEquipesSnapshot = {
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
};

export async function carregarEstadoEquipesAula(
  dataIso: string,
  aulaId: string,
): Promise<EstadoEquipesSnapshot | null> {
  const resp = await fetch(
    `${API_BASE_URL}/dias/${dataIso}/aulas/${aulaId}/estado-equipes`,
  );

  if (!resp.ok) {
    if (resp.status === 404) {
      return null;
    }
    const msg = await resp.text().catch(() => "");
    throw new Error(
      `Erro ao carregar estado de equipes da aula ${aulaId} do dia ${dataIso}: ${resp.status} ${msg}`,
    );
  }

  const json = await resp.json();

  const jogadores: PresencaJogadorDia[] = (json.jogadores ?? []).map(
    mapPresencaJogador,
  );
  const times: TimeDia[] = (json.times ?? []).map(mapTime);

  return { jogadores, times };
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

  const resp = await fetch(
    `${API_BASE_URL}/dias/${dataIso}/aulas/${aulaId}/estado-equipes`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!resp.ok) {
    const msg = await resp.text().catch(() => "");
    throw new Error(
      `Erro ao salvar estado de equipes da aula ${aulaId} do dia ${dataIso}: ${resp.status} ${msg}`,
    );
  }
}
