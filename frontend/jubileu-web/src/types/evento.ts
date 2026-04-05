export type EventoTipo = "AULA" | "JOGO_LIVRE";
export type EventoStatus = "PLANEJADO" | "EM_ANDAMENTO" | "ENCERRADO" | "CANCELADO";
export type EventoParticipanteStatus =
  | "RSVP"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELED"
  | "NO_SHOW";
export type PartidaStatus = "PLANEJADA" | "EM_ANDAMENTO" | "ENCERRADA";

export type Evento = {
  id: number;
  dia_id: number;
  tipo: EventoTipo;
  status: EventoStatus;
  horario_inicio: string;
  horario_fim: string;
  inicio_at?: string | null;
  fim_at?: string | null;
};

export type EventoParticipante = {
  id: number;
  evento_id: number;
  jogador_id: number;
  status: EventoParticipanteStatus;
  rsvp_at?: string | null;
  checkin_at?: string | null;
  checkout_at?: string | null;
  arrival_seq?: number | null;
};

export type SeedPartidaPayload = {
  mode: "arrival_first";
  players_count: number;
  team_size: number;
};

export type SeedPartidaResponse = {
  partida: {
    id: number;
    evento_id: number;
    ordem: number;
    status: PartidaStatus;
    time_a_id: number;
    time_b_id: number;
  };
  teams: Array<{
    id: number;
    nome: string;
    jogadores_ids: number[];
  }>;
};

export type LancePayload = {
  tipo: string;
  payload: Record<string, unknown>;
  jogador_id?: number;
  client_event_id?: string;
};

export type Lance = {
  id: number;
  partida_id: number;
  evento_id: number;
  jogador_id?: number | null;
  tipo: string;
  payload: Record<string, unknown>;
  client_event_id?: string | null;
  created_by_user_id?: string | null;
  created_at: string;
};
