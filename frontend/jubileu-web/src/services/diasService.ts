// src/services/diasService.ts
import type {
  Dia,
  AulaDia,
  PresencaJogadorDia,
  TimeDia,
  AtributosJogadorDia,
} from "../types/dia";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// --- MAPPERS AUXILIARES ---

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
    jogadorId: j.jogador_id ?? j.id,
    nome: j.nome,
    status: j.status,
    atributos: mapAtributos(j),
    timeId: j.time_id ? String(j.time_id) : undefined,
  };
}

function mapTime(t: any): TimeDia {
  return {
    id: String(t.id),
    nome: t.nome,
    // ainda não estamos retornando jogadores por time no backend
    jogadoresIds: [],
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
    feriado: undefined, // backend ainda não trata feriado
  };
}

// --- SERVICES ---

// Usa a API real para carregar um dia pela data
export async function obterDiaPorData(dataIso: string): Promise<Dia> {
  const resp = await fetch(`${API_BASE_URL}/dias/${dataIso}`);

  if (!resp.ok) {
    throw new Error(`Erro ao buscar dia ${dataIso}: ${resp.status}`);
  }

  const json = await resp.json();
  return mapDia(json);
}

// Lista de dias (por enquanto MOCK sobre a API de dia único)
// Depois vamos trocar por GET /dias no backend
export async function listarDias(): Promise<Dia[]> {
  // coloque aqui as datas que você está usando no Swagger
  const datas = ["2025-11-20", "2025-11-21"];

  const dias = await Promise.all(datas.map(obterDiaPorData));

  // ordena só pra deixar bonitinho
  return dias.sort((a, b) => a.dataIso.localeCompare(b.dataIso));
}

// Ordena aulas pelo horário de início (utilizado em DiaDetalhe)
export function ordenarAulasPorHorario(aulas: AulaDia[]): AulaDia[] {
  return [...aulas].sort((a, b) =>
    a.horarioInicio.localeCompare(b.horarioInicio),
  );
}
