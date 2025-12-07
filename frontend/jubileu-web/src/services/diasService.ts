// src/services/diasService.ts
import type {
  Dia,
  AulaDia,
  PresencaJogadorDia,
  TimeDia,
  AtributosJogadorDia,
  StatusAula,
  TipoEventoAula,
} from "../types/dia";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ------------------------------------------------------------------
// Tipos auxiliares (como o backend realmente responde)
// ------------------------------------------------------------------

export type JogadorTurmaDTO = {
  id: number;
  nome: string;
  apelido?: string;
};

type EstadoEquipesAPI = {
  aula_id: number;
  jogadores: any[];
  times: any[];
};

// ------------------------------------------------------------------
// MAPPERS AUXILIARES
// ------------------------------------------------------------------

function mapAtributos(j: any): AtributosJogadorDia {
  const attrs = j.atributos ?? {};

  return {
    gols: attrs.gols ?? j.gols ?? 0,
    assistencias: attrs.assistencias ?? j.assistencias ?? 0,
    defesas: attrs.defesas ?? j.defesas ?? 0,
    chiliques: attrs.chiliques ?? j.chiliques ?? 0,
    faltas: attrs.faltas ?? j.faltas ?? 0,
  };
}

function mapPresencaJogador(j: any): PresencaJogadorDia {
  return {
    jogadorId: j.jogador_id ?? j.jogadorId ?? j.id,
    nome: j.nome,
    status: j.status,
    atributos: mapAtributos(j),
    timeId: j.time_id ? String(j.time_id) : j.timeId,
  };
}

function mapTime(t: any): TimeDia {
  return {
    id: String(t.id),
    nome: t.nome,
    jogadoresIds: t.jogadoresIds ?? [], // backend ainda não manda isso
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
    tipo: aula.tipo as TipoEventoAula,
    horarioInicio: aula.horario_inicio,
    horarioFim: aula.horario_fim,
    status: aula.status as StatusAula,
    jogadores,
    times,
    partidasCount: (aula.partidas ?? []).length,
  };
}

function mapDia(data: any): Dia {
  return {
    dataIso: data.data_iso,
    aulas: (data.aulas ?? []).map(mapAula),
    feriado: undefined, // backend ainda não trata feriado
  };
}

// ------------------------------------------------------------------
// DIAS
// ------------------------------------------------------------------

export async function obterDiaPorData(dataIso: string): Promise<Dia> {
  const resp = await fetch(`${API_BASE_URL}/dias/${dataIso}`);

  if (!resp.ok) {
    throw new Error(`Erro ao buscar dia ${dataIso}: ${resp.status}`);
  }

  const json = await resp.json();
  return mapDia(json);
}

/**
 * Agenda de dias para a página /dias.
 * Por enquanto, busca algumas datas fixas (pode evoluir depois).
 */
export async function listarDias(): Promise<Dia[]> {
  // datas que você está usando no swagger / testes
  const datas = ["2025-11-20", "2025-11-21"];

  const dias = await Promise.all(
    datas.map(async (d) => {
      try {
        return await obterDiaPorData(d);
      } catch (err) {
        // se uma data falhar, só loga e ignora
        // eslint-disable-next-line no-console
        console.error("Erro ao carregar dia", d, err);
        return null;
      }
    }),
  );

  const filtrados = dias.filter((d): d is Dia => d !== null);

  return filtrados.sort((a, b) => a.dataIso.localeCompare(b.dataIso));
}

// Ordena aulas pelo horário de início (utilizado em DiaDetalhe)
export function ordenarAulasPorHorario(aulas: AulaDia[]): AulaDia[] {
  return [...aulas].sort((a, b) =>
    a.horarioInicio.localeCompare(b.horarioInicio),
  );
}

// ------------------------------------------------------------------
// AULAS
// ------------------------------------------------------------------

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

// ------------------------------------------------------------------
// TIMES DA AULA
// ------------------------------------------------------------------

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

// ------------------------------------------------------------------
// ESTADO DE EQUIPES DA AULA (JOGADORES + TIMES)
// ------------------------------------------------------------------

export async function carregarEstadoEquipesAula(
  dataIso: string,
  aulaId: string,
): Promise<{ aulaId: string; jogadores: PresencaJogadorDia[]; times: TimeDia[] }> {
  const resp = await fetch(
    `${API_BASE_URL}/dias/${dataIso}/aulas/${aulaId}/estado-equipes`,
  );

  if (resp.status === 404) {
    // estado ainda não salvo → devolve vazio
    return { aulaId, jogadores: [], times: [] };
  }

  if (!resp.ok) {
    const msg = await resp.text().catch(() => "");
    throw new Error(
      `Erro ao carregar estado de equipes da aula ${aulaId}: ${resp.status} ${msg}`,
    );
  }

  const json: EstadoEquipesAPI = await resp.json();

  const jogadores: PresencaJogadorDia[] = (json.jogadores ?? []).map(
    mapPresencaJogador,
  );
  const times: TimeDia[] = (json.times ?? []).map(mapTime);

  return {
    aulaId: String(json.aula_id ?? aulaId),
    jogadores,
    times,
  };
}

export async function salvarEstadoEquipesAula(
  dataIso: string,
  aulaId: string,
  jogadores: PresencaJogadorDia[],
  times: TimeDia[],
): Promise<void> {
  const payload = {
    jogadores: jogadores.map((j) => ({
      id: j.jogadorId,
      jogador_id: j.jogadorId,
      nome: j.nome,
      status: j.status,
      time_id: j.timeId ? Number(j.timeId) : null,
      atributos: j.atributos,
    })),
  times: times.map((t) => ({
      id: Number(t.id),
      nome: t.nome,
      caracteristica: (t as any).caracteristica ?? null,
      cor_camisa: (t as any).corCamisa ?? null,
    })),
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
      `Erro ao salvar estado de equipes da aula ${aulaId}: ${resp.status} ${msg}`,
    );
  }
}

// ------------------------------------------------------------------
// JOGADORES DA TURMA (PROVISÓRIO / MOCK)
// ------------------------------------------------------------------

/**
 * Lista de jogadores de uma turma.
 * Hoje está como MOCK; quando existir o endpoint real
 * (/turmas/{turmaId}/jogadores), é só trocar o fetch aqui.
 */
export async function listarJogadoresDaTurma(
  turmaId: string,
): Promise<JogadorTurmaDTO[]> {
  // TODO: trocar por chamada real pro backend assim que existir:
  // const resp = await fetch(`${API_BASE_URL}/turmas/${turmaId}/jogadores`);
  // ...

  // Mock simples só pra ter dados na tela:
  const mock: JogadorTurmaDTO[] = [
    { id: 1, nome: "Felipe Dal Molin – Fixo" },
    { id: 2, nome: "André Silva – Pivô" },
    { id: 3, nome: "Carlos Eduardo – Ala" },
    { id: 4, nome: "Bruno Souza – Goleiro" },
  ];

  // só pra não ficar estranho usar turmaId pra nada:
  // eslint-disable-next-line no-console
  console.debug("listarJogadoresDaTurma (mock) turmaId=", turmaId);

  return mock;
}