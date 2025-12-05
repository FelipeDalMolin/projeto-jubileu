export type JogadorEquipe = {
  id: number;
  nome: string;
};

export type Equipe = {
  id: number;
  nome: string;
};

export type EstadoEquipesDia = {
  diaId: string;
  jogadores: JogadorEquipe[];
  equipes: Equipe[];
  atribuicoes: {
    jogadorId: number;
    equipeId: number | null;
  }[];
};
