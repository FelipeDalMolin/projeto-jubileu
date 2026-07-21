import { cachedDashboardJson } from "./dashboardClient";

export type ResumoPartidas = {
  totalPartidas: number;
  mediaGolsPorPartida: number;
  totalGols: number;
};

export type SeriePorDiaItem = {
  data: string;
  partidas: number;
  gols: number;
};

export type SeriePorDia = {
  items: SeriePorDiaItem[];
};

export type PartidaListaItem = {
  partidaId: number;
  eventoId: number;
  dataIso: string;
  eventoTipo: string;
  eventoStatus: string;
  turmaId: number | null;
  turmaNome: string | null;
  ordem: number;
  partidaStatus: string;
  timeAId: number;
  timeANome: string;
  timeBId: number;
  timeBNome: string;
  golsTimeA: number;
  golsTimeB: number;
};

export type PartidasLista = { items: PartidaListaItem[] };

export async function obterResumoPartidas(options?: { force?: boolean }): Promise<ResumoPartidas> {
  return cachedDashboardJson<ResumoPartidas>("/dashboards/partidas/resumo", options?.force);
}

export async function obterSeriePorDia(
  params: { periodo: number; turma?: number | null },
  options?: { force?: boolean },
): Promise<SeriePorDia> {
  const search = new URLSearchParams();
  if (params.periodo) search.set("periodo", String(params.periodo));
  if (params.turma) search.set("turma", String(params.turma));
  const qs = search.toString();
  const path = `/dashboards/partidas/serie-por-dia${qs ? `?${qs}` : ""}`;
  return cachedDashboardJson<SeriePorDia>(path, options?.force);
}

export async function obterListaPartidas(
  params: { periodo: number; turma?: number | null },
  options?: { force?: boolean },
): Promise<PartidasLista> {
  const search = new URLSearchParams();
  if (params.periodo) search.set("periodo", String(params.periodo));
  if (params.turma) search.set("turma", String(params.turma));
  const qs = search.toString();
  const path = `/dashboards/partidas/lista${qs ? `?${qs}` : ""}`;
  return cachedDashboardJson<PartidasLista>(path, options?.force);
}
