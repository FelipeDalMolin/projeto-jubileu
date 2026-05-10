import type { PresencaJogadorDia, TimeDia } from "./dia";
import type { EstatisticaJogadorPartida } from "./dia";

export type PartidaEstado = {
  id: number;
  ordem: number;
  status: "PLANEJADA" | "EM_ANDAMENTO" | "ENCERRADA";
  inicio_at?: string | null;
  fim_at?: string | null;
  timeAId: string;
  timeBId: string;
  golsTimeA: number;
  golsTimeB: number;
  estatisticas?: EstatisticaJogadorPartida[] | null;
};

export type EquipesEstado = {
  jogadores: PresencaJogadorDia[];
  times: TimeDia[];
};

export type EventoEstadoDTO = {
  evento_id: number;
  data_iso: string;
  version: number;
  updated_at: string;
  equipes: EquipesEstado;
  partidas: PartidaEstado[];
};

export type EventoEstadoResponse =
  | { status: 204; data?: undefined }
  | { status: 200; data: EventoEstadoDTO };
