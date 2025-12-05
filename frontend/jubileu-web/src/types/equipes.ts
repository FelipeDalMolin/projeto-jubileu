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
  /**
   * Chave da aula/dia na API. No nosso caso estamos usando aula.id.
   */
  diaId: string;
  jogadores: JogadorEquipeView[];
  equipes: EquipeView[];
  atribuicoes: {
    jogadorId: number;
    equipeId: number | null;
  }[];
};
