export type LanceTimelineItem = {
  id: number;
  eventoId: number;
  partidaId: number;
  tipo: string;
  timeId: number | null;
  timeNome: string | null;
  jogadorPrincipalId: number | null;
  jogadorPrincipalNome: string | null;
  jogadorSecundarioId: number | null;
  jogadorSecundarioNome: string | null;
  author: string | null;
  minute: number | null;
  createdAt: string;
  payload: Record<string, unknown>;
};
