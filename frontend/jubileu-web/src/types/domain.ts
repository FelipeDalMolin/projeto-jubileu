// src/types/domain.ts
// Tipos de domínio "centrais" da aplicação Jubileu.
// Aqui ficam tipos genéricos reaproveitados entre várias páginas
// (turmas, jogadores, dias, etc.).

// ---------------------------------------------------------
// Status geral do cadastro do jogador no clube
// ---------------------------------------------------------
export type StatusJogador = "ativo" | "temporariamente_inativo" | "desligado";

// ---------------------------------------------------------
// Jogador cadastrado no sistema (visão global)
// ---------------------------------------------------------
export type Jogador = {
  id: number;
  /** Nome completo do jogador */
  nome: string;
  /** Apelido exibido nas telas (opcional) */
  apelido?: string;
  /** Nome da turma principal do jogador (ex.: "Sub-11", "Adulto") */
  turma?: string;
  /** Posição principal/secundária (ex.: "Goleiro", "Pivô", "Ala") */
  posicao2?: string;
  /** Status do vínculo com o clube */
  status: StatusJogador;
  /** Estatísticas agregadas (opcional – pode ser preenchido pelo backend) */
  gols?: number;
  chiliques?: number;
};

// ---------------------------------------------------------
// Enum de dias da semana – usado em Turma.recorrencia
// ---------------------------------------------------------
export type DiaDaSemana =
  | "SEG"
  | "TER"
  | "QUA"
  | "QUI"
  | "SEX"
  | "SAB"
  | "DOM";

// ---------------------------------------------------------
// Turma (categoria) do clube
// ---------------------------------------------------------
export type Turma = {
  id: number;
  /** Nome da turma (ex.: "Sub-11", "Adulto", "Feminino") */
  nome: string;
  /** Dias recorrentes do treino dessa turma */
  recorrencia: DiaDaSemana[];
  /**
   * Jogadores vinculados à turma.
   * O detalhe de cada jogador vem de `Jogador` (tabela / coleção própria).
   */
  jogadoresIds: number[];
};
