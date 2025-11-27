// src/services/diasService.ts
import type {
  AulaDia,
  Dia,
  PresencaJogadorDia,
} from "../types/dia";

// --------------------------------------------------------------
// MOCK inicial – depois isso vira chamada HTTP para a API
// --------------------------------------------------------------

const jogadoresSub11: PresencaJogadorDia[] = [
  {
    jogadorId: 1,
    nome: "João Victor (JV) – Goleiro",
    status: "presente",
    atributos: {
      gols: 0,
      assistencias: 0,
      defesas: 0,
      chiliques: 0,
      faltas: 0,
    },
  },
  {
    jogadorId: 2,
    nome: "Matheus Rocha – Pivô",
    status: "presente",
    atributos: {
      gols: 0,
      assistencias: 0,
      defesas: 0,
      chiliques: 0,
      faltas: 0,
    },
  },
];

const aulaSub11: AulaDia = {
  id: "aula-sub11-1",
  turmaId: "sub11",
  turmaNome: "Sub-11",
  numeroAulaNaTurma: 12,
  tipo: "AULA",
  horarioInicio: "19:00",
  horarioFim: "20:00",
  status: "PLANEJADA",
  jogadores: jogadoresSub11,
  times: [],
  partidasCount: 0,
};

const aulaAdulto: AulaDia = {
  id: "aula-adulto-2",
  turmaId: "adulto",
  turmaNome: "Adulto",
  numeroAulaNaTurma: 22,
  tipo: "AULA",
  horarioInicio: "20:00",
  horarioFim: "21:00",
  status: "PLANEJADA",
  jogadores: [],
  times: [],
  partidasCount: 0,
};

const MOCK_DIAS: Dia[] = [
  {
    dataIso: "2025-11-20",
    feriado: null,
    aulas: [aulaSub11, aulaAdulto],
  },
];

// --------------------------------------------------------------
// Funções de serviço
// --------------------------------------------------------------

/**
 * Lista todos os dias com algo planejado/cadastrado.
 * Hoje: MOCK. Futuro: chamada HTTP (fetch/axios).
 */
export async function listarDias(): Promise<Dia[]> {
  return Promise.resolve(MOCK_DIAS);
}

/**
 * Obtém os dados completos de um dia pela data ISO (YYYY-MM-DD).
 * Retorna null se ainda não houver nada planejado para a data.
 */
export async function obterDiaPorData(dataIso: string): Promise<Dia | null> {
  const dia = MOCK_DIAS.find((d) => d.dataIso === dataIso) ?? null;
  return Promise.resolve(dia);
}

/**
 * Ordena as aulas de um dia por horário de início.
 */
export function ordenarAulasPorHorario(aulas: AulaDia[]): AulaDia[] {
  return [...aulas].sort((a, b) =>
    a.horarioInicio.localeCompare(b.horarioInicio)
  );
}
