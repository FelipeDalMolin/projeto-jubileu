import { useWorkspaceAula } from "./useWorkspaceAula";

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
  return useWorkspaceAula({
    dataIso,
    aulaId: eventoId,
    enabled,
    intervalMs,
    manualControl,
  });
}
