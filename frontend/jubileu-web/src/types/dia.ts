// Equipes do dia
export type EquipeDia = {
  id: number;
  nome: string;
  corCamisa?: string;
};

// Status de presenca/frequencia no dia
export type StatusPresenca =
  | "presente"
  | "faltou"
  | "atestado"
  | "coringa"
  | "so_treino";

// Jogadores do dia (modelo simples, usado nas telas antigas)
export type JogadorDia = {
  id: number;
  nome: string;
  apelido?: string;
  status?: StatusPresenca;
  // null/undefined = esta no pool de jogadores disponiveis (sem equipe)
  equipeId?: number | null;
};

// Estatistica de um jogador dentro de UMA partida
export type EstatisticaJogadorPartida = {
  id?: number;
  jogadorAulaId: number;
  gols: number;
  assistencias: number;
  defesas: number;
  chiliques: number;
  faltas: number;
  nota?: number;
};

// Partida da aula
export type PartidaAula = {
  id: number;
  ordem: number;
  timeAId: string;
  timeBId: string;
  golsTimeA: number;
  golsTimeB: number;
  estatisticas: EstatisticaJogadorPartida[];
};

// --------------------------------------------------------------
// NOVOS TIPOS para a arquitetura de Agenda do Dia / Aula
// --------------------------------------------------------------

export type StatusAula =
  | "PLANEJADA"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "CANCELADA";

// Atributos agregados de um jogador ao longo da AULA (nao de uma partida especifica)
export type AtributosJogadorDia = {
  gols: number;
  assistencias: number;
  defesas: number;
  chiliques: number;
  faltas: number;
};

// Presenca + atributos de um jogador dentro da AULA
export interface PresencaJogadorDia {
  jogadorId: number;
  nome: string;
  status: StatusPresenca;
  timeId?: string;

  // NOVOS CAMPOS (opcionais)
  ativoNaTurma?: boolean;
  podeJogar?: boolean;
}

// Time dentro de uma AULA
export type TimeDia = {
  id: string;
  nome: string; // "Time 1", "Time Azul" etc.
  jogadoresIds: number[];
  caracteristica?: string;
  corCamisa?: string;
};

export type TipoEventoAula = "AULA" | "JOGO" | "OUTRO";

// Aula / evento em um determinado dia
export type AulaDia = {
  id: string;
  turmaId: number;
  turmaNome: string;
  /**
   * Numero sequencial da aula da turma (ex.: Aula #12 da turma Sub-11).
   */
  numeroAulaNaTurma: number;
  tipo: TipoEventoAula;
  horarioInicio: string; // "19:00"
  horarioFim: string; // "20:00"
  status: StatusAula;
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
  /**
   * Quantidade de partidas ja configuradas para esta aula.
   * Depois voce pode trocar por um array de PartidaAula especifico da aula.
   */
  partidasCount: number;
};

export type TipoFeriado = "NACIONAL" | "ESTADUAL" | "MUNICIPAL" | "CLUBE";

export type FeriadoInfo = {
  nome: string;
  tipo: TipoFeriado;
};

// Dia na agenda (e o que vamos usar em /dias e /dias/:dataIso)
export type Dia = {
  /**
   * Data em formato ISO (YYYY-MM-DD).
   * Tambem e usada na URL: /dias/:dataIso
   */
  dataIso: string;
  aulas: AulaDia[];
  /**
   * Informacoes de feriado, se houver.
   * Pode vir de API externa + feriados cadastrados do clube.
   */
  feriado?: FeriadoInfo | null;
};
