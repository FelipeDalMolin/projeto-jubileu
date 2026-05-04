export type RotacaoGrupo = {
  grupo_id: string;
  jogadores_ids: number[];
  target_size: number;
  faltam: number;
  completo: boolean;
};

export type RotacaoGrupoPatch = {
  grupo_id: string;
  jogadores_ids: number[];
};

export type RotacaoIndicadores = {
  jogadores_em_campo: number;
  jogadores_na_fila: number;
  proximos_times_completos: number;
  jogadores_aguardando_complemento: number;
};

export type EventoRotacaoEstado = {
  evento_id: number;
  team_size_ref: number;
  duracao_partida_segundos: number;
  fila_jogadores_ids: number[];
  proximos_times: RotacaoGrupo[];
  indicadores: RotacaoIndicadores;
  version: number;
  updated_at?: string | null;
  updated_by_user_id?: string | null;
};

export type RotacaoPreview = {
  token: string;
  evento_id: number;
  grupo_alvo_id: string;
  needed_count: number;
  candidatos_ids: number[];
  sorteados_ids: number[];
  nao_sorteados_ids: number[];
  expires_at: string;
};

export type RotacaoAuditRecord = {
  token: string;
  status: "PREVIEWED" | "CONFIRMED" | "CANCELED" | "EXPIRED";
  grupo_alvo_id: string;
  needed_count: number;
  candidatos_ids: number[];
  sorteados_ids: number[];
  nao_sorteados_ids: number[];
  partida_origem_id?: number | null;
  created_by_user_id?: string | null;
  created_at: string;
  confirmed_at?: string | null;
  expires_at: string;
};

export type RotacaoConfirmResult = {
  estado: EventoRotacaoEstado;
  audit: RotacaoAuditRecord;
};
