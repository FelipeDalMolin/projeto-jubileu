import type { Lance, LancePayload } from "../../types/evento";
import { postJson, type AuthHeaders } from "./http";

export async function criarLancePartida(
  partidaId: number,
  payload: LancePayload,
  auth: AuthHeaders,
): Promise<Lance> {
  const data = await postJson<{ lance: Lance }>(`/api/partidas/${partidaId}/lances`, auth, payload);
  return data.lance;
}
