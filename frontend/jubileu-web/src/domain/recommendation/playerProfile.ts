import type { RankingItem } from "../trofeu/trofeuTypes";
import type { RankingTimeline } from "../trofeu/trofeuScoring";

export type PlayerProfile = {
  jogadorId: number;
  scoreFinal: number;
  presenca: number;
  tendencia: number; // positivo = subindo
  confiabilidade: number; // 0..1 baseado em presenca
  volatilidade: number; // 0..1 baseado na variação de posição
};

export function buildPlayerProfiles(
  rankingItems: RankingItem[],
  timeline: RankingTimeline,
): PlayerProfile[] {
  const timelineMap = new Map<number, { points: (number | null)[]; pos: (number | null)[] }>();
  timeline.items.forEach((it) => {
    timelineMap.set(it.jogadorId, { points: it.pointsByBucket, pos: it.positionByBucket });
  });

  return rankingItems.map((item) => {
    const tl = timelineMap.get(item.jogadorId);
    const pos = tl?.pos ?? [];
    const positions = pos.filter((p): p is number => p !== null);
    const last = positions.at(-1) ?? null;
    const prev = positions.length > 1 ? positions[positions.length - 2] : null;
    const tendencia = prev !== null && last !== null ? prev - last : 0;

    const minPos = positions.length ? Math.min(...positions) : 0;
    const maxPos = positions.length ? Math.max(...positions) : 0;
    const volatilidade = maxPos > 0 ? (maxPos - minPos) / maxPos : 0;

    return {
      jogadorId: item.jogadorId,
      scoreFinal: item.scoreFinal,
      presenca: item.presenca,
      tendencia,
      confiabilidade: Math.max(0, Math.min(1, item.presenca)),
      volatilidade,
    };
  });
}
