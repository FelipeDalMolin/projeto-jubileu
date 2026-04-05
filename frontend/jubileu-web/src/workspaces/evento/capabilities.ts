import type { UserRole } from "../../services/authService";
import type { TipoEventoAula, StatusAula } from "../../types/dia";

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
  tipo: TipoEventoAula;
  status: StatusAula;
  role: UserRole;
};

const ADMIN_ROLES: UserRole[] = ["admin", "treinador", "auxiliar"];

function add(set: Set<EventoCapability>, ...caps: EventoCapability[]) {
  caps.forEach((cap) => set.add(cap));
}

export function resolveEventoCapabilities(input: ResolveInput): Set<EventoCapability> {
  const caps = new Set<EventoCapability>();
  const isAdminRole = ADMIN_ROLES.includes(input.role);

  add(caps, "participants_view");

  if (input.tipo === "AULA") {
    add(caps, "workspace_equipes", "workspace_partidas");
    if (isAdminRole) {
      add(caps, "event_admin_actions");
    }
    return caps;
  }

  if (input.tipo === "JOGO") {
    add(caps, "rsvp", "checkin_self", "lances");
    if (isAdminRole) {
      add(caps, "checkin_manual", "seed_partida", "event_admin_actions");
    }
    return caps;
  }

  if (isAdminRole && input.status !== "CONCLUIDA") {
    add(caps, "event_admin_actions");
  }

  return caps;
}
