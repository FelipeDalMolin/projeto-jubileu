// Equipes do dia
export type EquipeDia = {
  id: number;
  nome: string;
  corCamisa?: string;
};

// Status de presença/frequência no dia
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
  // null/undefined = está no pool de jogadores disponíveis (sem equipe)
  equipeId?: number | null;
};

// Estatística de um jogador dentro de UMA partida
export type EstatisticaJogadorPartida = {
  jogadorId: number;
  gols: number;
  assistencias: number;
  defesas: number;
  chiliques: number;
  faltas: number;
  nota?: number;
};

// Partida do dia
export type PartidaDia = {
  id: number;
  equipeAId: number;
  equipeBId: number;
  golsEquipeA: number;
  golsEquipeB: number;
  // você pode acrescentar depois: tempo, local, observações etc.
};

// --------------------------------------------------------------
// NOVOS TIPOS para a arquitetura de Agenda do Dia / Aula
// --------------------------------------------------------------

export type StatusAula =
  | "PLANEJADA"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "CANCELADA";

// Atributos agregados de um jogador ao longo da AULA (não de uma partida específica)
export type AtributosJogadorDia = {
  gols: number;
  assistencias: number;
  defesas: number;
  chiliques: number;
  faltas: number;
};

// Presença + atributos de um jogador dentro da AULA
export type PresencaJogadorDia = {
  jogadorId: number;
  nome: string;
  status: StatusPresenca;
  atributos: AtributosJogadorDia;
  /**
   * Identificador do time dentro da aula (ex.: "time-1").
   * undefined = ainda não alocado em nenhum time.
   */
  timeId?: string;
};

// Time dentro de uma AULA
export type TimeDia = {
  id: string;
  nome: string; // "Time 1", "Time Azul" etc.
  jogadoresIds: number[];
};

export type TipoEventoAula = "AULA" | "JOGO" | "OUTRO";

// Aula / evento em um determinado dia
export type AulaDia = {
  id: string;
  turmaId: string;
  turmaNome: string;
  /**
   * Número sequencial da aula da turma (ex.: Aula #12 da turma Sub-11).
   */
  numeroAulaNaTurma: number;
  tipo: TipoEventoAula;
  horarioInicio: string; // "19:00"
  horarioFim: string; // "20:00"
  status: StatusAula;
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
  /**
   * Quantidade de partidas já configuradas para esta aula.
   * Depois você pode trocar por um array de PartidaDia específico da aula.
   */
  partidasCount: number;
};

export type TipoFeriado = "NACIONAL" | "ESTADUAL" | "MUNICIPAL" | "CLUBE";

export type FeriadoInfo = {
  nome: string;
  tipo: TipoFeriado;
};

// Dia na agenda (é o que vamos usar em /dias e /dias/:dataIso)
export type Dia = {
  /**
   * Data em formato ISO (YYYY-MM-DD).
   * Também é usada na URL: /dias/:dataIso
   */
  dataIso: string;
  aulas: AulaDia[];
  /**
   * Informações de feriado, se houver.
   * Pode vir de API externa + feriados cadastrados do clube.
   */
  feriado?: FeriadoInfo | null;
};