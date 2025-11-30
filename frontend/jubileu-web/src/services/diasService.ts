// src/services/diasService.ts

import type { AulaDia, Dia, PresencaJogadorDia } from "../types/dia";
import { MOCK_JOGADORES, MOCK_TURMAS } from "../pages/turmas/MockTurmas";

// ============================================================
// Helpers
// ============================================================

// Converte jogadores de uma turma (MockTurmas) para PresencaJogadorDia
function mapJogadoresParaPresenca(ids: number[]): PresencaJogadorDia[] {
  return ids.map((id) => {
    const j = MOCK_JOGADORES.find((x) => x.id === id);
    if (!j) {
      return {
        jogadorId: id,
        nome: "Jogador não encontrado",
        status: "so_treino",
        atributos: { gols: 0, assistencias: 0, defesas: 0, chiliques: 0, faltas: 0 },
      };
    }
    return {
      jogadorId: j.id,
      nome: `${j.nome}${j.posicao2 ? " – " + j.posicao2 : ""}`,
      status: "presente",
      atributos: { gols: 0, assistencias: 0, defesas: 0, chiliques: 0, faltas: 0 },
    };
  });
}

// ============================================================
// Mock das aulas — usando os jogadores reais das turmas
// ============================================================

// Aula SUB-11
const aulaSub11: AulaDia = {
  id: "aula-sub11-1",
  turmaId: "sub11",
  turmaNome: "Sub-11",
  numeroAulaNaTurma: 12,
  tipo: "AULA",
  horarioInicio: "19:00",
  horarioFim: "20:00",
  status: "PLANEJADA",
  jogadores: mapJogadoresParaPresenca(
    MOCK_TURMAS.find((t) => t.nome === "Sub-11")?.jogadoresIds ?? []
  ),
  times: [],
  partidasCount: 0,
};

// Aula ADULTO (agora com 10+ jogadores automaticamente)
const aulaAdulto: AulaDia = {
  id: "aula-adulto-22",
  turmaId: "adulto",
  turmaNome: "Adulto",
  numeroAulaNaTurma: 22,
  tipo: "AULA",
  horarioInicio: "20:00",
  horarioFim: "21:00",
  status: "PLANEJADA",
  jogadores: mapJogadoresParaPresenca(
    MOCK_TURMAS.find((t) => t.nome === "Adulto")?.jogadoresIds ?? []
  ),
  times: [],
  partidasCount: 0,
};

// ============================================================
// MOCK de DIAS
// ============================================================

const MOCK_DIAS: Dia[] = [
  {
    dataIso: "2025-11-20",
    feriado: null,
    aulas: [aulaSub11, aulaAdulto],
  },

  // você pode duplicar esse bloco para criar novos dias mock
  // copiando o dia e mudando dataIso + numero das aulas
];

// ============================================================
// Funções de serviço
// ============================================================

/**
 * Lista todos os dias cadastrados.
 * Hoje: MOCK.
 */
export async function listarDias(): Promise<Dia[]> {
  return Promise.resolve(MOCK_DIAS);
}

/**
 * Obtém os dados completos de um dia pela data ISO (YYYY-MM-DD).
 * Retorna null se não houver nada cadastrado.
 */
export async function obterDiaPorData(dataIso: string): Promise<Dia | null> {
  return Promise.resolve(MOCK_DIAS.find((d) => d.dataIso === dataIso) ?? null);
}

/**
 * Ordena aulas por horário de início.
 * Útil para a página DiaDetalhe.
 */
export function ordenarAulasPorHorario(aulas: AulaDia[]): AulaDia[] {
  return [...aulas].sort((a, b) =>
    a.horarioInicio.localeCompare(b.horarioInicio)
  );
}
