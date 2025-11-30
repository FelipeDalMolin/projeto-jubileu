// src/pages/turmas/MockTurmas.ts

import type { Jogador, Turma } from "../../types/domain";

/**
 * Lista mock de jogadores cadastrados no sistema.
 * Aqui você pode depois trocar por dados vindos da API.
 */
export const MOCK_JOGADORES: Jogador[] = [
  // ------- SUB-11 -------
  {
    id: 1,
    nome: "João Victor",
    apelido: "JV",
    turma: "Sub-11",
    posicao2: "Goleiro",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 2,
    nome: "Matheus Rocha",
    apelido: "Matheus",
    turma: "Sub-11",
    posicao2: "Pivô",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 3,
    nome: "Pedro Henrique",
    apelido: "PH",
    turma: "Sub-11",
    posicao2: "Ala",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },

  // ------- ADULTO (pelo menos 10 jogadores) -------
  {
    id: 101,
    nome: "Felipe Dal Molin",
    apelido: "Felipe",
    turma: "Adulto",
    posicao2: "Fixo",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 102,
    nome: "André Silva",
    apelido: "André",
    turma: "Adulto",
    posicao2: "Pivô",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 103,
    nome: "Carlos Eduardo",
    apelido: "Cadu",
    turma: "Adulto",
    posicao2: "Ala",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 104,
    nome: "Bruno Souza",
    apelido: "Brunão",
    turma: "Adulto",
    posicao2: "Goleiro",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 105,
    nome: "Gustavo Lima",
    apelido: "Guga",
    turma: "Adulto",
    posicao2: "Ala",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 106,
    nome: "Lucas Almeida",
    apelido: "Lucão",
    turma: "Adulto",
    posicao2: "Pivô",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 107,
    nome: "Ricardo Santos",
    apelido: "Rick",
    turma: "Adulto",
    posicao2: "Fixo",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 108,
    nome: "Marcelo Ribeiro",
    apelido: "Marcelo",
    turma: "Adulto",
    posicao2: "Ala",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 109,
    nome: "Thiago Oliveira",
    apelido: "Thiago",
    turma: "Adulto",
    posicao2: "Ala",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 110,
    nome: "Rafael Costa",
    apelido: "Rafa",
    turma: "Adulto",
    posicao2: "Pivô",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 111,
    nome: "Fernando Lima",
    apelido: "Nando",
    turma: "Adulto",
    posicao2: "Goleiro",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
];

/**
 * Lista mock de turmas. Cada turma referencia os jogadores via IDs.
 */
export const MOCK_TURMAS: Turma[] = [
  {
    id: 1,
    nome: "Sub-11",
    recorrencia: ["SEG", "QUA"], // ajuste conforme o tipo DiaDaSemana
    jogadoresIds: [1, 2, 3],
  },
  {
    id: 2,
    nome: "Adulto",
    recorrencia: ["TER", "QUI"],
    jogadoresIds: [
      101, 102, 103, 104, 105,
      106, 107, 108, 109, 110, 111, // 11 jogadores no Adulto
    ],
  },
];

/**
 * Helpers simples (opcionais), se o TurmasPage quiser algo assim.
 */
export function getTurmaById(id: number): Turma | undefined {
  return MOCK_TURMAS.find((t) => t.id === id);
}

export function getJogadoresDaTurma(turmaId: number): Jogador[] {
  const turma = getTurmaById(turmaId);
  if (!turma) return [];
  return MOCK_JOGADORES.filter((j) => turma.jogadoresIds.includes(j.id));
}
