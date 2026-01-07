export type EstatisticaResumo = {
  id: number;
  categoria: string;
  turma: string;
  valor: number;
  variacao: number; // percentual
  ultimaAtualizacao: string;
};

export const estatisticasMock: EstatisticaResumo[] = [
  {
    id: 201,
    categoria: "Gols por jogo",
    turma: "Sub-11",
    valor: 2.8,
    variacao: 8,
    ultimaAtualizacao: "2025-01-12",
  },
  {
    id: 202,
    categoria: "Participação média",
    turma: "Sub-13",
    valor: 16,
    variacao: -4,
    ultimaAtualizacao: "2025-01-08",
  },
  {
    id: 203,
    categoria: "Treinos concluídos",
    turma: "Adulto",
    valor: 9,
    variacao: 3,
    ultimaAtualizacao: "2024-12-18",
  },
  {
    id: 204,
    categoria: "Cartões / faltas",
    turma: "Feminino",
    valor: 1.1,
    variacao: -12,
    ultimaAtualizacao: "2025-01-14",
  },
  {
    id: 205,
    categoria: "Assistências por jogo",
    turma: "Sub-11",
    valor: 1.9,
    variacao: 5,
    ultimaAtualizacao: "2024-12-28",
  },
  {
    id: 206,
    categoria: "Gols por jogo",
    turma: "Adulto",
    valor: 3.4,
    variacao: -2,
    ultimaAtualizacao: "2025-01-03",
  },
];
