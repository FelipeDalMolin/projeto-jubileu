import type { RankingItem, DeltaPosicao } from "./trofeuTypes";

export function calcularDeltaPosicoes(
  rankingAtual: RankingItem[],
  rankingAnterior: RankingItem[],
): DeltaPosicao[] {
  const posAnterior = new Map<number, number>();
  rankingAnterior.forEach((item, idx) => {
    posAnterior.set(item.jogadorId, idx + 1);
  });

  return rankingAtual.map((item, idx) => {
    const posAtual = idx + 1;
    const anterior = posAnterior.get(item.jogadorId) ?? null;
    const delta = anterior !== null ? anterior - posAtual : null;
    return {
      jogadorId: item.jogadorId,
      posicaoAtual: posAtual,
      posicaoAnterior: anterior,
      delta,
    };
  });
}
