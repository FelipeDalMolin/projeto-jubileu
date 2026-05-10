import { filtrarPorPeriodo, filtrarPorTurma, totalEventos } from "./trofeuSelectors";
import type {
  RegistroEvento,
  Jogador,
  RankingInput,
  RankingItem,
} from "./trofeuTypes";
import { startOfWeek, parseISO, addDays, isAfter, isEqual } from "date-fns";

export type RankingTimelineItem = {
  jogadorId: number;
  pointsByBucket: (number | null)[];
  positionByBucket: (number | null)[];
};

export type RankingTimeline = {
  buckets: string[];
  items: RankingTimelineItem[];
};

type Acumulador = {
  jogos: number;
  v: number;
  e: number;
  d: number;
  gols: number;
  cartoes2min: number;
  chilique: number;
};

function novoAcumulador(): Acumulador {
  return { jogos: 0, v: 0, e: 0, d: 0, gols: 0, cartoes2min: 0, chilique: 0 };
}

export function calcularRanking(input: RankingInput): RankingItem[] {
  const { registros, jogadores, periodoDias, turmaId, incluirZeroJogos = false, busca } = input;

  const registrosFiltradosTurma: RegistroEvento[] = filtrarPorTurma(registros, turmaId);
  const registrosNoPeriodo: RegistroEvento[] = filtrarPorPeriodo(registrosFiltradosTurma, periodoDias);
  const eventosPeriodo = totalEventos(registrosNoPeriodo);

  const baseJogadores = new Map<number, Jogador>();
  jogadores.forEach((j) => baseJogadores.set(j.id, j));

  const acc = new Map<number, Acumulador>();
  const presencas = new Map<number, number>(); // eventos em que esteve presente

  registrosNoPeriodo.forEach((registro) => {
    registro.presencas.forEach((p) => {
      const jog = baseJogadores.get(p.jogadorId);
      if (!jog) return;

      if (p.participou) {
        const atual = acc.get(p.jogadorId) ?? novoAcumulador();
        atual.jogos += 1;
        if (p.resultado === "V") atual.v += 1;
        if (p.resultado === "E") atual.e += 1;
        if (p.resultado === "D") atual.d += 1;
        atual.gols += p.gols;
        atual.cartoes2min += p.cartoes2min;
        atual.chilique += p.chilique;
        acc.set(p.jogadorId, atual);
      }

      const pres = presencas.get(p.jogadorId) ?? 0;
      presencas.set(p.jogadorId, pres + (p.participou ? 1 : 0));
    });
  });

  const itens: RankingItem[] = [];

  baseJogadores.forEach((jogador) => {
    const stats = acc.get(jogador.id) ?? novoAcumulador();
    const eventosJogador = presencas.get(jogador.id) ?? 0;
    const presencaRatio = eventosPeriodo > 0 ? Math.min(1, eventosJogador / eventosPeriodo) : 0;
    if (!incluirZeroJogos && stats.jogos === 0) return;

    const pontos = stats.v * 3 + stats.e;
    const scoreFinal = pontos * (0.85 + 0.15 * presencaRatio);

    itens.push({
      jogadorId: jogador.id,
      nome: jogador.nome,
      apelido: jogador.apelido,
      presenca: Number(presencaRatio.toFixed(3)),
      jogos: stats.jogos,
      vitorias: stats.v,
      empates: stats.e,
      derrotas: stats.d,
      pontosBrutos: pontos,
      scoreFinal: Number(scoreFinal.toFixed(3)),
      gols: stats.gols,
      cartoes2min: stats.cartoes2min,
      chilique: stats.chilique,
    });
  });

  const buscaTerm = busca?.trim().toLowerCase() ?? "";
  const filtrados = buscaTerm
    ? itens.filter(
        (i) =>
          i.nome.toLowerCase().includes(buscaTerm) ||
          (i.apelido ?? "").toLowerCase().includes(buscaTerm),
      )
    : itens;

  return filtrados.sort((a, b) => {
    if (b.scoreFinal !== a.scoreFinal) return b.scoreFinal - a.scoreFinal;
    if (b.presenca !== a.presenca) return b.presenca - a.presenca;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    if (b.gols !== a.gols) return b.gols - a.gols;
    return b.jogos - a.jogos;
  });
}

export function getRankingTimeline(params: {
  registros: RegistroEvento[];
  jogadores: Jogador[];
  turmaId?: number | null;
  periodoDias: number;
  bucket: "dia" | "semana";
  incluirZeroJogos?: boolean;
  busca?: string;
}): RankingTimeline {
  const { registros, jogadores, turmaId, periodoDias, bucket, incluirZeroJogos, busca } = params;
  const hoje = new Date();
  const limite = addDays(hoje, -periodoDias);

  const registrosFiltrados = filtrarPorTurma(
    registros.filter((r) => {
      const d = parseISO(r.dataIso);
      return isAfter(d, limite) || isEqual(d, limite);
    }),
    turmaId,
  );

  const bucketKeys = new Set<string>();
  const bucketDates: Record<string, { start: Date; end: Date }> = {};

  registrosFiltrados.forEach((r) => {
    const d = parseISO(r.dataIso);
    if (bucket === "dia") {
      const key = r.dataIso;
      bucketKeys.add(key);
      bucketDates[key] = { start: d, end: d };
    } else {
      const start = startOfWeek(d, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      const key = start.toISOString().slice(0, 10);
      bucketKeys.add(key);
      bucketDates[key] = { start, end };
    }
  });

  const buckets = Array.from(bucketKeys).sort();
  const itemsMap = new Map<number, RankingTimelineItem>();

  buckets.forEach((bucketKey, idx) => {
    const range = bucketDates[bucketKey];
    const registrosBucket = registrosFiltrados.filter((r) => {
      const d = parseISO(r.dataIso);
      return d >= range.start && d <= range.end;
    });

    const diasRange = Math.max(
      1,
      Math.round((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    const ranking = calcularRanking({
      registros: registrosBucket,
      jogadores,
      periodoDias: diasRange,
      turmaId,
      incluirZeroJogos,
      busca,
    });

    ranking.forEach((item, posIdx) => {
      const existing = itemsMap.get(item.jogadorId) ?? {
        jogadorId: item.jogadorId,
        pointsByBucket: Array(buckets.length).fill(null),
        positionByBucket: Array(buckets.length).fill(null),
      };
      existing.pointsByBucket[idx] = item.scoreFinal;
      existing.positionByBucket[idx] = posIdx + 1;
      itemsMap.set(item.jogadorId, existing);
    });
  });

  return {
    buckets,
    items: Array.from(itemsMap.values()),
  };
}
