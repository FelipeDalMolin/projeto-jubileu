import type { UserRole } from "../../services/authService";
import { normalizeEventoStatus, normalizeEventoTipo } from "../../types/evento";

export type EventoCapability =
  | "workspace_equipes"
  | "workspace_partidas"
  | "rsvp"
  | "checkin_self"
  | "checkin_manual"
  | "participants_view"
  | "event_admin_actions"
  | "seed_partida"
  | "lances";

type ResolveInput = {
  tipo: string;
  status: string;
  role: UserRole;
};

const ADMIN_ROLES: UserRole[] = ["admin", "treinador", "auxiliar"];

function add(set: Set<EventoCapability>, ...caps: EventoCapability[]) {
  caps.forEach((cap) => set.add(cap));
}

export function resolveEventoCapabilities(input: ResolveInput): Set<EventoCapability> {
  const caps = new Set<EventoCapability>();
  const isAdminRole = ADMIN_ROLES.includes(input.role);
  const tipo = normalizeEventoTipo(input.tipo);
  const status = normalizeEventoStatus(input.status);

  add(caps, "participants_view");

  if (tipo === "AULA") {
    add(caps, "workspace_equipes", "workspace_partidas");
    if (isAdminRole) {
      add(caps, "event_admin_actions", "lances");
    }
    return caps;
  }

  if (tipo === "JOGO_LIVRE") {
    add(caps, "rsvp", "checkin_self");
    if (isAdminRole) {
      add(caps, "checkin_manual", "seed_partida", "event_admin_actions", "lances");
    }
    return caps;
  }

  if (isAdminRole && status !== "ENCERRADO" && status !== "CANCELADO") {
    add(caps, "event_admin_actions");
  }

  return caps;
}
