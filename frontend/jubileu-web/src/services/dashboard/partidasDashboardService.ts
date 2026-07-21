const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

type CacheEntry<T> = { ts: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();
const TTL = 30 * 1000;

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

export async function obterResumoPartidas(options?: { force?: boolean }): Promise<ResumoPartidas> {
  return fetchJson<ResumoPartidas>("/api/dashboards/partidas/resumo", options?.force);
}

export async function obterSeriePorDia(
  params: { periodo: number; turma?: number | null },
  options?: { force?: boolean },
): Promise<SeriePorDia> {
  const search = new URLSearchParams();
  if (params.periodo) search.set("periodo", String(params.periodo));
  if (params.turma) search.set("turma", String(params.turma));
  const qs = search.toString();
  const path = `/api/dashboards/partidas/serie-por-dia${qs ? `?${qs}` : ""}`;
  return fetchJson<SeriePorDia>(path, options?.force);
}

export async function obterListaPartidas(
  params: { periodo: number; turma?: number | null },
  options?: { force?: boolean },
): Promise<PartidasLista> {
  const search = new URLSearchParams();
  if (params.periodo) search.set("periodo", String(params.periodo));
  if (params.turma) search.set("turma", String(params.turma));
  const qs = search.toString();
  const path = `/api/dashboards/partidas/lista${qs ? `?${qs}` : ""}`;
  return fetchJson<PartidasLista>(path, options?.force);
}
