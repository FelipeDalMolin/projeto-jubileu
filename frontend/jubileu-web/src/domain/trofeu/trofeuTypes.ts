export type ResultadoPartida = "V" | "E" | "D" | null;

export type Jogador = {
  id: number;
  nome: string;
  apelido?: string | null;
  status?: string;
};

export type Turma = {
  id: number;
  nome: string;
};

export type RegistroPresenca = {
  jogadorId: number;
  participou: boolean;
  resultado: ResultadoPartida;
  gols: number;
  cartoes2min: number;
  chilique: number;
};

export type RegistroEvento = {
  dataIso: string; // YYYY-MM-DD
  turmaId: number;
  presencas: RegistroPresenca[];
};

export type RankingInput = {
  turmaId?: number | null;
  periodoDias: number;
  incluirZeroJogos?: boolean;
  busca?: string;
  registros: RegistroEvento[];
  jogadores: Jogador[];
};

export type RankingItem = {
  jogadorId: number;
  nome: string;
  apelido?: string | null;
  presenca: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  pontosBrutos: number;
  scoreFinal: number;
  gols: number;
  cartoes2min: number;
  chilique: number;
};

export type DeltaPosicao = {
  jogadorId: number;
  posicaoAtual: number | null;
  posicaoAnterior: number | null;
  delta: number | null;
};
