// src/pages/turmas/MockTurmas.ts
import type { Jogador, Turma } from "../../types/domain";

export const MOCK_JOGADORES_TURMAS: Jogador[] = [
  {
    id: 1,
    nome: "João Victor",
    apelido: "JVi",
    turma: "Sub-11",
    posicao: "Goleiro",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 2,
    nome: "Pedro Silva",
    turma: "Sub-13",
    posicao: "Atacante",
    status: "ativo",
    gols: 12,
    chiliques: 1,
  },
  {
    id: 3,
    nome: "Carlos Santos",
    apelido: "Carlinhos",
    turma: "Adulto",
    posicao: "Zagueiro",
    status: "temporariamente_afastado",
    gols: 3,
    chiliques: 0,
  },
  {
    id: 4,
    nome: "Lucas Lima",
    turma: "Adulto",
    posicao: "Ala",
    status: "ativo",
    gols: 9,
    chiliques: 2,
  },
  {
    id: 5,
    nome: "Matheus Rocha",
    turma: "Sub-11",
    posicao: "Pivô",
    status: "desligado",
    gols: 1,
    chiliques: 0,
  },
];

export const MOCK_TURMAS: Turma[] = [
  { id: 1, nome: "Sub-11", recorrencia: ["TER", "QUI"], jogadoresIds: [1, 5] },
  { id: 2, nome: "Sub-13", recorrencia: ["QUA"], jogadoresIds: [2] },
  { id: 3, nome: "Adulto", recorrencia: ["TER", "QUI"], jogadoresIds: [3, 4] },
];
