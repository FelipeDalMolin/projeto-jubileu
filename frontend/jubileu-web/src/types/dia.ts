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
  jogadorEventoId: number;
  gols: number;
  assistencias: number;
  chiliques: number;
  faltas: number;
  nota?: number;
};

// Partida da evento
export type PartidaEvento = {
  id: number;
  ordem: number;
  timeAId: string;
  timeBId: string;
  golsTimeA: number;
  golsTimeB: number;
  estatisticas: EstatisticaJogadorPartida[];
};

// --------------------------------------------------------------
// NOVOS TIPOS para a arquitetura de Agenda do Dia / Evento
// --------------------------------------------------------------

export type StatusEvento =
  | "PLANEJADO"
  | "EM_ANDAMENTO"
  | "ENCERRADO"
  | "CANCELADO";

// Atributos agregados de um jogador ao longo do evento (nao de uma partida especifica)
export type AtributosJogadorDia = {
  gols: number;
  assistencias: number;
  chiliques: number;
  faltas: number;
};

// Presenca + atributos de um jogador dentro do evento
export interface PresencaJogadorDia {
  jogadorId: number;
  nome: string;
  status: StatusPresenca;
  timeId?: string;

  // NOVOS CAMPOS (opcionais)
  ativoNaTurma?: boolean;
  podeJogar?: boolean;
}

// Time dentro de um evento
export type TimeDia = {
  id: string;
  nome: string; // "Time 1", "Time Azul" etc.
  jogadoresIds: number[];
  caracteristica?: string;
  corCamisa?: string;
};

export type TipoEventoModo = "AULA" | "JOGO_LIVRE" | "OUTRO";

// Evento / evento em um determinado dia
export type EventoDia = {
  id: string;
  turmaId?: number | null;
  turmaNome?: string | null;
  /**
   * Numero sequencial da evento da turma (ex.: Evento #12 da turma Sub-11).
   */
  numeroEventoNaTurma?: number | null;
  tipo: TipoEventoModo;
  horarioInicio: string; // "19:00"
  horarioFim: string; // "20:00"
  status: StatusEvento;
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
  /**
   * Quantidade de partidas ja configuradas para esta evento.
   * Depois voce pode trocar por um array de PartidaEvento especifico da evento.
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
  eventos: EventoDia[];
  /**
   * Informacoes de feriado, se houver.
   * Pode vir de API externa + feriados cadastrados do clube.
   */
  feriado?: FeriadoInfo | null;
};
