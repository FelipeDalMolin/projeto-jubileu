import { cachedDashboardJson } from "./dashboardClient";

export type ItemScore = {
  jogadorId: number | null;
  nome: string;
  valor: number;
};

export type GolsPorTurma = {
  turmaId: number | null;
  turmaNome: string | null;
  gols: number;
};

export type VisaoGeralEstatisticas = {
  topArtilheiros: ItemScore[];
  topPresencas: ItemScore[];
  golsPorTurma: GolsPorTurma[];
};

export async function obterVisaoGeralEstatisticas(
  params: { periodo: number; turma?: number | null },
  options?: { force?: boolean },
): Promise<VisaoGeralEstatisticas> {
  const search = new URLSearchParams();
  if (params.periodo) search.set("periodo", String(params.periodo));
  if (params.turma) search.set("turma", String(params.turma));
  const qs = search.toString();
  const path = `/dashboards/estatisticas/visao-geral${qs ? `?${qs}` : ""}`;
  return cachedDashboardJson<VisaoGeralEstatisticas>(path, options?.force);
}
