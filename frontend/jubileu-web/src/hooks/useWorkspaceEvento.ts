import { useMemo } from "react";

import { useWorkspaceAula } from "./useWorkspaceAula";
import { toWorkspaceEvento } from "../workspaces/evento/workspaceEventoAdapter";

type Params = {
  dataIso?: string;
  eventoId?: string;
  enabled?: boolean;
  intervalMs?: number;
  manualControl?: boolean;
};

export function useWorkspaceEvento({
  dataIso,
  eventoId,
  enabled = true,
  intervalMs = 2500,
  manualControl = false,
}: Params) {
  const aulaWorkspace = useWorkspaceAula({
    dataIso,
    aulaId: eventoId,
    enabled,
    intervalMs,
    manualControl,
  });

  const workspace = useMemo(() => {
    if (!aulaWorkspace.workspace) return null;
    return toWorkspaceEvento(aulaWorkspace.workspace);
  }, [aulaWorkspace.workspace]);

  return {
    ...aulaWorkspace,
    workspace,
    workspaceLegacy: aulaWorkspace.workspace,
  };
}
