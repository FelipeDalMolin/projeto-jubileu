import { useMemo, useState, type DragEvent } from "react";

import Modal from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { TimeDia } from "../../../types/dia";
import type { EventoRotacaoEstado, RotacaoGrupoPatch, RotacaoPreview } from "../../../types/rotacao";

type Props = {
  estado: EventoRotacaoEstado | null;
  jogadorNomeById: Record<number, string>;
  times: TimeDia[];
  partidaAtivaTimeIds: string[];
  onSaveQueues: (payload: { fila_jogadores_ids: number[]; proximos_times: RotacaoGrupoPatch[] }) => Promise<void>;
  onPreview: (grupoId: string) => Promise<RotacaoPreview>;
  onConfirm: (token: string) => Promise<void>;
};

function toNome(id: number, map: Record<number, string>) {
  return map[id] ?? `#${id}`;
}

function toFilaTimes(estado: EventoRotacaoEstado | null): RotacaoGrupoPatch[] {
  if (!estado) return [];
  return estado.proximos_times.map((g) => ({
    grupo_id: g.grupo_id,
    jogadores_ids: [...g.jogadores_ids],
  }));
}

function timeIdFromGrupoId(grupoId: string): string | null {
  if (!grupoId.startsWith("time:")) return null;
  return grupoId.replace("time:", "");
}

export function RotacaoFilaPanel({
  estado,
  jogadorNomeById,
  times,
  partidaAtivaTimeIds,
  onSaveQueues,
  onPreview,
  onConfirm,
}: Props) {
  const [preview, setPreview] = useState<RotacaoPreview | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSavingQueue, setIsSavingQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const hasIncompleteGroup = useMemo(
    () => Boolean(estado?.proximos_times.some((g) => !g.completo)),
    [estado],
  );

  const filaTimes = useMemo(() => toFilaTimes(estado), [estado]);
  const partidaAtivaSet = useMemo(() => new Set(partidaAtivaTimeIds), [partidaAtivaTimeIds]);
  const timesEmCampo = useMemo(
    () => times.filter((t) => partidaAtivaSet.has(t.id)),
    [partidaAtivaSet, times],
  );

  const idsTimesEnfileirados = useMemo(() => {
    const ids = new Set<string>();
    for (const grupo of filaTimes) {
      const tid = timeIdFromGrupoId(grupo.grupo_id);
      if (tid) ids.add(tid);
    }
    return ids;
  }, [filaTimes]);

  const timesDisponiveisParaFila = useMemo(
    () =>
      times.filter(
        (t) => t.jogadoresIds.length > 0 && !idsTimesEnfileirados.has(t.id) && !partidaAtivaSet.has(t.id),
      ),
    [idsTimesEnfileirados, partidaAtivaSet, times],
  );

  async function handlePreview(grupoId: string) {
    try {
      setError(null);
      setInfo(null);
      setIsBusy(true);
      const result = await onPreview(grupoId);
      setPreview(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao gerar preview do sorteio");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    try {
      setError(null);
      setIsBusy(true);
      await onConfirm(preview.token);
      setInfo("Sorteio confirmado e aplicado na fila.");
      setPreview(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar sorteio");
    } finally {
      setIsBusy(false);
    }
  }

  async function salvarFilaTimes(nextFila: RotacaoGrupoPatch[]) {
    if (!estado) return;
    try {
      setError(null);
      setInfo(null);
      setIsSavingQueue(true);
      await onSaveQueues({
        fila_jogadores_ids: [...estado.fila_jogadores_ids],
        proximos_times: nextFila,
      });
      setInfo("Fila de times atualizada.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar fila de times");
    } finally {
      setIsSavingQueue(false);
    }
  }

  async function handleAppendTime(time: TimeDia) {
    if (partidaAtivaSet.has(time.id)) {
      setInfo(`O ${time.nome} esta em campo e nao entra na fila de proximos ate encerrar a partida.`);
      return;
    }
    const grupo: RotacaoGrupoPatch = {
      grupo_id: `time:${time.id}`,
      jogadores_ids: [...time.jogadoresIds],
    };
    await salvarFilaTimes([...filaTimes, grupo]);
  }

  async function handleMoveQueueItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= filaTimes.length) return;
    const next = [...filaTimes];
    const current = next[index];
    next[index] = next[target];
    next[target] = current;
    await salvarFilaTimes(next);
  }

  async function handleRemoveQueueItem(index: number) {
    const next = filaTimes.filter((_, idx) => idx !== index);
    await salvarFilaTimes(next);
  }

  async function onDropTimeCard(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const timeId = e.dataTransfer.getData("application/x-jubileu-time-id");
    if (!timeId) return;
    const time = times.find((t) => t.id === timeId);
    if (!time || time.jogadoresIds.length === 0 || idsTimesEnfileirados.has(time.id)) return;
    if (partidaAtivaSet.has(time.id)) {
      setInfo(`O ${time.nome} ja esta em campo nesta partida.`);
      return;
    }
    await handleAppendTime(time);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Fila / Proximos Times</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!estado ? (
          <div className="text-sm text-muted-foreground">Carregando estado de rotacao...</div>
        ) : (
          <>
            <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Jogadores em campo</div>
                <div className="text-lg font-semibold">{estado.indicadores.jogadores_em_campo}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Jogadores na fila</div>
                <div className="text-lg font-semibold">{estado.indicadores.jogadores_na_fila}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Proximos completos</div>
                <div className="text-lg font-semibold">{estado.indicadores.proximos_times_completos}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">Aguardando complemento</div>
                <div className="text-lg font-semibold">{estado.indicadores.jogadores_aguardando_complemento}</div>
              </div>
            </div>

            <div className="rounded-md bg-slate-100 p-2 text-xs text-slate-700">
              Team size de referencia: <strong>{estado.team_size_ref}</strong>. O sistema permite times desbalanceados e
              incompletos sem bloqueio.
            </div>

            <div className="rounded-md border p-2">
              <div className="mb-1 text-xs font-medium text-foreground">Time(s) atualmente em campo</div>
              {timesEmCampo.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nenhum time em campo no momento.</div>
              ) : (
                <div className="space-y-2">
                  {timesEmCampo.map((time) => (
                    <div key={`em-campo-${time.id}`} className="rounded-md border bg-emerald-50 p-2">
                      <div className="mb-1 flex items-center justify-between">
                        <strong className="text-sm">{time.nome}</strong>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
                          Em campo
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {time.jogadoresIds.map((id) => (
                          <span
                            key={`em-campo-${time.id}-${id}`}
                            className="inline-flex rounded-full bg-slate-800 px-2 py-1 text-xs text-white"
                          >
                            {toNome(id, jogadorNomeById)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border border-dashed p-2">
              <div className="mb-1 text-xs font-medium text-foreground">Fila de jogadores (ordem global)</div>
              {estado.fila_jogadores_ids.length === 0 ? (
                <div className="text-xs text-muted-foreground">Fila vazia no momento.</div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {estado.fila_jogadores_ids.map((id, idx) => (
                    <span
                      key={`fila-${id}-${idx}`}
                      className="inline-flex items-center rounded-full bg-slate-200 px-2 py-1 text-xs"
                    >
                      {idx + 1}. {toNome(id, jogadorNomeById)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border p-2">
              <div className="mb-2 text-xs font-medium text-foreground">Montagem rapida da fila de times</div>
              <div className="mb-2 text-xs text-muted-foreground">
                Arraste um time de "Montagem de Equipes" para este card, ou use os botoes abaixo.
                Times em campo ficam registrados acima e nao entram na fila ate o fim da partida.
              </div>
              {timesDisponiveisParaFila.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Todos os times montados ja estao na fila, ou ainda nao ha times elegiveis com jogadores.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {timesDisponiveisParaFila.map((time) => (
                    <Button
                      key={`append-time-${time.id}`}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleAppendTime(time)}
                      disabled={isSavingQueue}
                    >
                      + {time.nome}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="rounded-md border border-dashed p-2"
              onDrop={(e) => void onDropTimeCard(e)}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="mb-1 text-xs font-medium text-foreground">Fila de times (sequencia de jogo)</div>
              {filaTimes.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Nenhum time na sequencia. Envie times da montagem para iniciar a fila.
                </div>
              ) : (
                <div className="space-y-2">
                  {filaTimes.map((grupo, idx) => {
                    const timeId = timeIdFromGrupoId(grupo.grupo_id);
                    const timeMatch = timeId ? times.find((t) => t.id === timeId) : null;
                    const isAtivo = Boolean(timeId && partidaAtivaSet.has(timeId));
                    return (
                      <div key={`fila-time-${grupo.grupo_id}-${idx}`} className="rounded-md border bg-white p-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            #{idx + 1} {timeMatch?.nome ?? grupo.grupo_id}
                          </div>
                          <div className="flex items-center gap-1">
                            {isAtivo ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
                                Em campo
                              </span>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleMoveQueueItem(idx, -1)}
                              disabled={idx === 0 || isSavingQueue}
                            >
                              Subir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleMoveQueueItem(idx, 1)}
                              disabled={idx === filaTimes.length - 1 || isSavingQueue}
                            >
                              Descer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleRemoveQueueItem(idx)}
                              disabled={isSavingQueue}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {grupo.jogadores_ids.map((id) => (
                            <span
                              key={`${grupo.grupo_id}-${id}`}
                              className="inline-flex rounded-full bg-slate-800 px-2 py-1 text-xs text-white"
                            >
                              {toNome(id, jogadorNomeById)}
                            </span>
                          ))}
                          {grupo.jogadores_ids.length === 0 ? (
                            <span className="text-xs text-muted-foreground">Grupo vazio</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {estado.proximos_times.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Ainda nao ha grupos de proximos times.
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {estado.proximos_times.map((grupo) => (
                  <div
                    key={grupo.grupo_id}
                    className={`rounded-md border p-3 ${
                      grupo.completo ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <strong>{grupo.grupo_id}</strong>
                      <span className="text-xs">
                        {grupo.jogadores_ids.length}/{grupo.target_size}
                      </span>
                    </div>
                    <div className="mb-2 text-xs text-muted-foreground">
                      {grupo.completo ? "Time completo" : `Incompleto: faltam ${grupo.faltam} jogador(es)`}
                    </div>
                    <div className="mb-2 text-[11px] text-slate-600">
                      Complemento usa somente jogadores da fila global fora de campo.
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {grupo.jogadores_ids.map((id) => (
                        <span
                          key={`${grupo.grupo_id}-${id}`}
                          className="inline-flex rounded-full bg-slate-800 px-2 py-1 text-xs text-white"
                        >
                          {toNome(id, jogadorNomeById)}
                        </span>
                      ))}
                    </div>
                    {!grupo.completo ? (
                      <Button
                        size="sm"
                        onClick={() => void handlePreview(grupo.grupo_id)}
                        disabled={isBusy || estado.fila_jogadores_ids.length < grupo.faltam}
                      >
                        Sortear para completar time
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {!hasIncompleteGroup ? (
              <div className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">
                Todos os proximos grupos estao completos.
              </div>
            ) : null}
          </>
        )}

        {error ? <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        {info ? <div className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{info}</div> : null}
      </CardContent>

      <Modal open={Boolean(preview)} title="Preview do sorteio" onClose={() => setPreview(null)}>
        {preview ? (
          <div className="space-y-3 text-sm">
            <div>
              <strong>Grupo alvo:</strong> {preview.grupo_alvo_id}
            </div>
            <div>
              <strong>Necessario:</strong> {preview.needed_count}
            </div>

            <div>
              <div className="mb-1 font-medium">Candidatos</div>
              <div className="flex flex-wrap gap-1">
                {preview.candidatos_ids.map((id) => (
                  <span key={`cand-${id}`} className="rounded-full bg-slate-200 px-2 py-1 text-xs">
                    {toNome(id, jogadorNomeById)}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1 font-medium">Sorteados</div>
              <div className="flex flex-wrap gap-1">
                {preview.sorteados_ids.map((id) => (
                  <span key={`sel-${id}`} className="rounded-full bg-emerald-600 px-2 py-1 text-xs text-white">
                    {toNome(id, jogadorNomeById)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setPreview(null)} disabled={isBusy}>
                Cancelar
              </Button>
              <Button onClick={() => void handleConfirm()} disabled={isBusy}>
                Confirmar sorteio
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}
