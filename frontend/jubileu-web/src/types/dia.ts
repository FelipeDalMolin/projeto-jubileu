// Equipes do dia
export type EquipeDia = {
  id: number;
  nome: string;
  corCamisa?: string;
};

// Jogadores do dia
export type JogadorDia = {
  id: number;
  nome: string;
  apelido?: string;
  status?: "presente" | "faltou" | "coringa" | "so_treinou";
  // null/undefined = está no pool de jogadores disponíveis (sem time)
  equipeId?: number | null;
};

// Estatística de um jogador dentro de UMA partida
export type EstatisticaJogadorPartida = {
  jogadorId: number;
  gols: number;
  chiliques: number;
};

// Partida do dia.
// O placar será calculado a partir das estatísticas dos jogadores.
export type PartidaDia = {
  id: number;
  equipeA: number; // id de EquipeDia
  equipeB: number; // id de EquipeDia
  statsJogadores: EstatisticaJogadorPartida[];
};
