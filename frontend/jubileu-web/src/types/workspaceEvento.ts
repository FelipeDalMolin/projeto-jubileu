import type { EventoStatus, EventoTipo } from "./evento";
import type {
  WorkspaceAula,
  WorkspaceAulaEquipes,
  WorkspaceAulaHeader,
  WorkspaceAulaKpis,
  WorkspaceAulaMeta,
  WorkspaceAulaPartida,
  WorkspaceAulaWarning,
} from "./workspaceAula";

export type WorkspaceEventoMeta = Omit<WorkspaceAulaMeta, "status" | "tipo"> & {
  status: EventoStatus;
  tipo: EventoTipo;
  legacy_status: WorkspaceAulaMeta["status"];
  legacy_tipo: WorkspaceAulaMeta["tipo"];
};

export type WorkspaceEvento = Omit<WorkspaceAula, "meta"> & {
  meta: WorkspaceEventoMeta;
};

export type WorkspaceEventoHeader = WorkspaceAulaHeader;
export type WorkspaceEventoKpis = WorkspaceAulaKpis;
export type WorkspaceEventoEquipes = WorkspaceAulaEquipes;
export type WorkspaceEventoPartida = WorkspaceAulaPartida;
export type WorkspaceEventoWarning = WorkspaceAulaWarning;

