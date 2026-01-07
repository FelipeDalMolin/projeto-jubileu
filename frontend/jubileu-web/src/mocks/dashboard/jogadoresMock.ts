export type JogadorResumo = {
  id: number;
  nome: string;
  turma: string;
  jogos: number;
  gols: number;
  assistencias: number;
  faltas: number;
  chiliques: number;
  ultimaAtuacao: string; // ISO date
};

export const jogadoresMock: JogadorResumo[] = [
  {
    id: 1,
    nome: "João Lima",
    turma: "Sub-11",
    jogos: 12,
    gols: 15,
    assistencias: 9,
    faltas: 3,
    chiliques: 1,
    ultimaAtuacao: "2025-01-12",
  },
  {
    id: 2,
    nome: "Marina Souza",
    turma: "Sub-13",
    jogos: 10,
    gols: 8,
    assistencias: 11,
    faltas: 1,
    chiliques: 0,
    ultimaAtuacao: "2025-01-18",
  },
  {
    id: 3,
    nome: "Rafa Costa",
    turma: "Adulto",
    jogos: 9,
    gols: 6,
    assistencias: 4,
    faltas: 2,
    chiliques: 2,
    ultimaAtuacao: "2024-12-22",
  },
  {
    id: 4,
    nome: "Beatriz Melo",
    turma: "Feminino",
    jogos: 14,
    gols: 18,
    assistencias: 7,
    faltas: 2,
    chiliques: 0,
    ultimaAtuacao: "2025-01-05",
  },
  {
    id: 5,
    nome: "Pedro Reis",
    turma: "Sub-11",
    jogos: 7,
    gols: 4,
    assistencias: 6,
    faltas: 5,
    chiliques: 1,
    ultimaAtuacao: "2024-10-01",
  },
  {
    id: 6,
    nome: "Lucas Xavier",
    turma: "Adulto",
    jogos: 6,
    gols: 9,
    assistencias: 2,
    faltas: 4,
    chiliques: 1,
    ultimaAtuacao: "2025-01-02",
  },
  {
    id: 7,
    nome: "Helena Dias",
    turma: "Feminino",
    jogos: 5,
    gols: 2,
    assistencias: 5,
    faltas: 1,
    chiliques: 0,
    ultimaAtuacao: "2024-11-15",
  },
  {
    id: 8,
    nome: "Caio Prado",
    turma: "Sub-13",
    jogos: 11,
    gols: 10,
    assistencias: 6,
    faltas: 2,
    chiliques: 2,
    ultimaAtuacao: "2024-12-28",
  },
];
