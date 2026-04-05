import { useWorkspaceAula } from "./useWorkspaceAula";

type Params = {
  dataIso?: string;
  eventoId?: string;
  enabled?: boolean;
  intervalMs?: number;
};

export function useWorkspaceEvento({
  dataIso,
  eventoId,
  enabled = true,
  intervalMs = 2500,
}: Params) {
  return useWorkspaceAula({
    dataIso,
    aulaId: eventoId,
    enabled,
    intervalMs,
  });
}
