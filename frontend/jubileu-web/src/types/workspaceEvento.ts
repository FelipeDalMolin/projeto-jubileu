import type { EventoStatus, EventoTipo } from "./evento";
import type { PartidaEstado } from "./eventoEstado";
import type { PresencaJogadorDia, TimeDia } from "./dia";

export type WorkspaceEventoMeta = {
  id: number;
  data_iso: string;
  turma_id: number;
  status: EventoStatus;
  tipo: EventoTipo;
  version: number;
};

export type WorkspaceEventoHeader = {
  titulo: string;
  horario_inicio: string;
  horario_fim: string;
};

export type WorkspaceEventoKpis = {
  total_jogadores: number;
  presentes: number;
  gols_total: number;
};

export type WorkspaceEventoWarning = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
};

export type WorkspaceEventoEquipes = {
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
};

export type WorkspaceEventoPartida = PartidaEstado;

export type WorkspaceEvento = {
  meta: WorkspaceEventoMeta;
  header: WorkspaceEventoHeader;
  kpis: WorkspaceEventoKpis;
  equipes: WorkspaceEventoEquipes;
  partidas: WorkspaceEventoPartida[];
  eventos: string[];
  warnings: WorkspaceEventoWarning[];
};

export type WorkspaceEventoResponse =
  | { status: 204; data?: undefined }
  | { status: 200; data: WorkspaceEvento };
