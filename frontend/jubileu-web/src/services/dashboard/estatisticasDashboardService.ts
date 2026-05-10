const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type CacheEntry<T> = { ts: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();
const TTL = 30 * 1000;

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

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchJson<T>(path: string, force = false): Promise<T> {
  const now = Date.now();
  const key = path;
  const cached = cache.get(key);
  if (!force && cached && now - cached.ts < TTL) {
    return cached.data as T;
  }

  const resp = await fetch(buildUrl(path));
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Erro ao carregar ${path}: ${resp.status} ${text}`);
  }
  const data = (await resp.json()) as T;
  cache.set(key, { ts: now, data });
  return data;
}

export async function obterVisaoGeralEstatisticas(
  params: { periodo: number; turma?: number | null },
  options?: { force?: boolean },
): Promise<VisaoGeralEstatisticas> {
  const search = new URLSearchParams();
  if (params.periodo) search.set("periodo", String(params.periodo));
  if (params.turma) search.set("turma", String(params.turma));
  const qs = search.toString();
  const path = `/api/dashboards/estatisticas/visao-geral${qs ? `?${qs}` : ""}`;
  return fetchJson<VisaoGeralEstatisticas>(path, options?.force);
}
