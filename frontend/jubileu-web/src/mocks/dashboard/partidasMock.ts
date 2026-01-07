export type PartidaResumo = {
  id: number;
  turma: string;
  dataIso: string;
  adversario: string;
  golsPro: number;
  golsContra: number;
  destaque: string;
};

export const partidasMock: PartidaResumo[] = [
  {
    id: 101,
    turma: "Sub-11",
    dataIso: "2025-01-10",
    adversario: "Tigres U11",
    golsPro: 3,
    golsContra: 1,
    destaque: "Pressão alta funcionou bem",
  },
  {
    id: 102,
    turma: "Sub-13",
    dataIso: "2025-01-07",
    adversario: "Águias",
    golsPro: 2,
    golsContra: 2,
    destaque: "Linha defensiva compacta",
  },
  {
    id: 103,
    turma: "Adulto",
    dataIso: "2024-12-18",
    adversario: "Veteranos",
    golsPro: 5,
    golsContra: 3,
    destaque: "Transições rápidas",
  },
  {
    id: 104,
    turma: "Feminino",
    dataIso: "2025-01-15",
    adversario: "Estrelas",
    golsPro: 1,
    golsContra: 0,
    destaque: "Defesa sólida, gol no fim",
  },
  {
    id: 105,
    turma: "Adulto",
    dataIso: "2024-10-02",
    adversario: "Bravos",
    golsPro: 0,
    golsContra: 1,
    destaque: "Faltou criação",
  },
  {
    id: 106,
    turma: "Sub-11",
    dataIso: "2024-12-02",
    adversario: "Raposinhas",
    golsPro: 4,
    golsContra: 2,
    destaque: "Meio-campo dominou",
  },
];
