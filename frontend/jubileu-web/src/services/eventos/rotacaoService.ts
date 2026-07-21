import type {
  EventoRotacaoEstado,
  RotacaoConfirmResult,
  RotacaoGrupoPatch,
  RotacaoPreview,
  ProximaPartidaPayload,
  ProximaPartidaResult,
} from "../../types/rotacao";
import { getJson, patchJson, postJson, type AuthHeaders } from "./http";

export async function obterEstadoRotacaoEvento(eventoId: number, auth: AuthHeaders): Promise<EventoRotacaoEstado> {
  return await getJson<EventoRotacaoEstado>(`/api/eventos/${eventoId}/rotacao/estado`, auth);
}

export async function criarProximaPartidaEvento(
  eventoId: number,
  payload: ProximaPartidaPayload,
  auth: AuthHeaders,
): Promise<ProximaPartidaResult> {
  return await postJson<ProximaPartidaResult>(`/api/eventos/${eventoId}/partidas/proxima`, auth, payload);
}

export async function previewSorteioRotacaoEvento(
  eventoId: number,
  payload: { grupo_alvo_id: string; partida_origem_id?: number | null },
  auth: AuthHeaders,
): Promise<RotacaoPreview> {
  return await postJson<RotacaoPreview>(`/api/eventos/${eventoId}/rotacao/preview-sorteio`, auth, payload);
}

export async function confirmarSorteioRotacaoEvento(
  eventoId: number,
  token: string,
  auth: AuthHeaders,
): Promise<RotacaoConfirmResult> {
  return await postJson<RotacaoConfirmResult>(`/api/eventos/${eventoId}/rotacao/confirmar-sorteio`, auth, { token });
}

export async function atualizarConfiguracaoRotacaoEvento(
  eventoId: number,
  payload: {
    team_size_ref?: number;
    duracao_partida_segundos?: number;
    fila_jogadores_ids?: number[];
    proximos_times?: RotacaoGrupoPatch[];
    expected_version?: number;
  },
  auth: AuthHeaders,
): Promise<EventoRotacaoEstado> {
  return await patchJson<EventoRotacaoEstado>(`/api/eventos/${eventoId}/rotacao/estado`, auth, payload);
}
