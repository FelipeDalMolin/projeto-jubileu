import type { PresencaJogadorDia, StatusAula, TimeDia, TipoEventoAula } from "./dia";
import type { PartidaEstado } from "./aulaEstado";

export type WorkspaceAulaMeta = {
  id: number;
  data_iso: string;
  turma_id: number;
  status: StatusAula;
  tipo: TipoEventoAula;
  version: number;
};

export type WorkspaceAulaHeader = {
  titulo: string;
  horario_inicio: string;
  horario_fim: string;
};

export type WorkspaceAulaKpis = {
  total_jogadores: number;
  presentes: number;
  gols_total: number;
};

export type WorkspaceAulaWarning = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
};

export type WorkspaceAulaEquipes = {
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
};

export type WorkspaceAulaPartida = PartidaEstado;

export type WorkspaceAula = {
  meta: WorkspaceAulaMeta;
  header: WorkspaceAulaHeader;
  kpis: WorkspaceAulaKpis;
  equipes: WorkspaceAulaEquipes;
  partidas: WorkspaceAulaPartida[];
  eventos: string[];
  warnings: WorkspaceAulaWarning[];
};

export type WorkspaceAulaResponse =
  | { status: 204; data?: undefined }
  | { status: 200; data: WorkspaceAula };
