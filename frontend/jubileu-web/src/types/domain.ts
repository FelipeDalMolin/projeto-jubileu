// src/types/domain.ts

export type StatusJogador = "ativo" | "temporariamente_afastado" | "desligado";

export type Jogador = {
  id: number;
  nome: string;
  apelido?: string;
  turma?: string;
  posicao?: string;
  status: StatusJogador;
  gols?: number;
  chiliques?: number;
};

export type DiaDaSemana = "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";

export type Turma = {
  id: number;
  nome: string;
  recorrencia: DiaDaSemana[];
  jogadoresIds: number[];
};

export type AulaStatus = "PLANEJADA" | "REALIZADA" | "CANCELADA";

export type Aula = {
  id: number;
  turmaId?: number;       // se undefined, evento avulso
  dataIso: string;        // "2025-11-20"
  status: AulaStatus;
};

export type DiaResumo = {
  id: number;             // id interno para lista/mock
  dataIso: string;        // chave que vai na URL (/dias/:dataIso)
  turmas: string[];
  totalEquipes: number;
  totalPartidas: number;
  totalGols: number;
  totalChiliques: number;
  treinoCancelado: boolean;
};
