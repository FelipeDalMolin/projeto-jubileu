import { cachedDashboardJson } from "./dashboardClient";

export type ResumoJogadores = {
  totalJogadores: number;
  mediaPresenca: number;
  totalGols: number;
};

export type RankingJogadorItem = {
  jogadorId: number;
  nome: string;
  turmaId: number | null;
  turmaNome: string | null;
  presencas: number;
  gols: number;
  assistencias: number;
  pontuacao: number;
  eventos: Array<{
    eventoId: number;
    dataIso: string;
    tipo: string;
    turmaNome: string | null;
    presencas: number;
    gols: number;
    assistencias: number;
  }>;
};

export type RankingJogadores = {
  items: RankingJogadorItem[];
};

export async function obterResumoJogadores(options?: { force?: boolean }): Promise<ResumoJogadores> {
  return cachedDashboardJson<ResumoJogadores>("/dashboards/jogadores/resumo", options?.force);
}

export async function obterRankingJogadores(
  params: { periodo: number; turma?: number | null },
  options?: { force?: boolean },
): Promise<RankingJogadores> {
  const search = new URLSearchParams();
  if (params.periodo) search.set("periodo", String(params.periodo));
  if (params.turma) search.set("turma", String(params.turma));
  const qs = search.toString();
  const path = `/dashboards/jogadores/ranking${qs ? `?${qs}` : ""}`;
  return cachedDashboardJson<RankingJogadores>(path, options?.force);
}
