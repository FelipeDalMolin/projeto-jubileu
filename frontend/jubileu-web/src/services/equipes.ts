// src/types/equipes.ts
export type JogadorEquipeView = {
  id: number;
  nome: string;
  equipeId: number | null;
};

export type EquipeView = {
  id: number;
  nome: string;
};

export type EstadoEquipesDia = {
  diaId: string;
  jogadores: JogadorEquipeView[];
  equipes: EquipeView[];
  atribuicoes: {
    jogadorId: number;
    equipeId: number | null;
  }[];
};
