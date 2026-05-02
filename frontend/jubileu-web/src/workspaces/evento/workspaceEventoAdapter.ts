import { normalizeEventoStatus, normalizeEventoTipo } from "../../types/evento";
import type { WorkspaceAula } from "../../types/workspaceAula";
import type { WorkspaceEvento } from "../../types/workspaceEvento";

export function toWorkspaceEvento(workspaceAula: WorkspaceAula): WorkspaceEvento {
  return {
    ...workspaceAula,
    meta: {
      ...workspaceAula.meta,
      status: normalizeEventoStatus(workspaceAula.meta.status),
      tipo: normalizeEventoTipo(workspaceAula.meta.tipo),
      legacy_status: workspaceAula.meta.status,
      legacy_tipo: workspaceAula.meta.tipo,
    },
  };
}

