import { useEffect, useMemo, useState } from "react";

import {
  cancelEvento,
  checkinEvento,
  checkinEventoJogador,
  criarLancePartida,
  desfazerCheckinEvento,
  desfazerRsvpEvento,
  endEvento,
  listarParticipantesEvento,
  listarPresentesEvento,
  rsvpEvento,
  seedPartidaEvento,
  startEvento,
  type AuthHeaders,
} from "../../../services/eventosService";
import type { EventoCapability } from "../capabilities";

type Props = {
  eventoId: number;
  caps: Set<EventoCapability>;
  auth: AuthHeaders | null;
  defaultPartidaId?: number | null;
  onRefreshWorkspace: () => Promise<void>;
};

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export default function EventoActionsPanel({
  eventoId,
  caps,
  auth,
  defaultPartidaId,
  onRefreshWorkspace,
}: Props) {
  const [loadingLists, setLoadingLists] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [presentes, setPresentes] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);

  const [manualJogadorId, setManualJogadorId] = useState("");
  const [seedPlayersCount, setSeedPlayersCount] = useState("10");
  const [seedTeamSize, setSeedTeamSize] = useState("5");
  const [partidaId, setPartidaId] = useState(defaultPartidaId ? String(defaultPartidaId) : "");
  const [lanceTipo, setLanceTipo] = useState("gol");
  const [lancePayloadJson, setLancePayloadJson] = useState("{\"pontos\": 1}");
  const [lanceJogadorId, setLanceJogadorId] = useState("");
  const [lanceClientEventId, setLanceClientEventId] = useState(makeIdempotencyKey());

  useEffect(() => {
    if (defaultPartidaId) {
      setPartidaId(String(defaultPartidaId));
    }
  }, [defaultPartidaId]);

  const canLoadLists = useMemo(
    () => Boolean(auth) && caps.has("participants_view"),
    [auth, caps],
  );

  async function refreshLists() {
    if (!auth || !canLoadLists) return;
    setLoadingLists(true);
    setActionError(null);
    try {
      const [p, prs] = await Promise.all([
        listarParticipantesEvento(eventoId, auth),
        listarPresentesEvento(eventoId, auth),
      ]);
      setParticipants(p.map((item) => `${item.jogador_id} (${item.status})`));
      setPresentes(prs.map((item) => `${item.jogador_id} (${item.status})`));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao carregar participantes";
      setActionError(message);
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    void refreshLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoadLists, eventoId, auth?.userId, auth?.role, auth?.jogadorId, auth?.accessToken]);

  async function runAction(action: () => Promise<unknown>, successMsg: string) {
    setActionError(null);
    setActionInfo(null);
    try {
      await action();
      setActionInfo(successMsg);
      await Promise.all([refreshLists(), onRefreshWorkspace()]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Falha na operacao";
      setActionError(message);
    }
  }

  if (!auth) {
    return (
      <section className="card mb-3">
        <div className="card-body">
          <h3 className="h6 mb-2">Acoes do evento</h3>
          <p className="mb-0 text-muted">
            Faca login e configure contexto de sessao para executar acoes de evento.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card mb-3">
      <div className="card-body">
        <h3 className="h6 mb-3">Acoes canonicias do evento</h3>

        {actionError && <div className="alert alert-warning py-2">{actionError}</div>}
        {actionInfo && <div className="alert alert-success py-2">{actionInfo}</div>}

        <div className="d-flex flex-wrap gap-2 mb-3">
          {caps.has("rsvp") && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => runAction(() => rsvpEvento(eventoId, auth), "RSVP registrado")}
              >
                RSVP
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  runAction(() => desfazerRsvpEvento(eventoId, auth), "RSVP removido")
                }
              >
                Cancelar RSVP
              </button>
            </>
          )}

          {caps.has("checkin_self") && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => runAction(() => checkinEvento(eventoId, auth), "Check-in realizado")}
              >
                Meu check-in
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() =>
                  runAction(() => desfazerCheckinEvento(eventoId, auth), "Check-in desfeito")
                }
              >
                Desfazer check-in
              </button>
            </>
          )}
        </div>

        {caps.has("checkin_manual") && (
          <div className="border rounded p-2 mb-3">
            <strong className="d-block mb-2">Check-in manual</strong>
            <div className="d-flex gap-2 align-items-center">
              <input
                className="form-control form-control-sm"
                placeholder="jogadorId"
                style={{ maxWidth: 160 }}
                value={manualJogadorId}
                onChange={(e) => setManualJogadorId(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() =>
                  runAction(async () => {
                    const id = Number(manualJogadorId);
                    if (!Number.isFinite(id)) {
                      throw new Error("Informe jogadorId valido");
                    }
                    await checkinEventoJogador(eventoId, id, auth);
                  }, "Check-in manual concluido")
                }
              >
                Aplicar
              </button>
            </div>
          </div>
        )}

        {caps.has("event_admin_actions") && (
          <div className="d-flex gap-2 flex-wrap mb-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              onClick={() => runAction(() => startEvento(eventoId, auth), "Evento iniciado")}
            >
              Iniciar
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-warning"
              onClick={() => runAction(() => endEvento(eventoId, auth), "Evento encerrado")}
            >
              Encerrar
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => runAction(() => cancelEvento(eventoId, auth), "Evento cancelado")}
            >
              Cancelar
            </button>
          </div>
        )}

        {caps.has("seed_partida") && (
          <div className="border rounded p-2 mb-3">
            <strong className="d-block mb-2">Seed da primeira partida</strong>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 140 }}
                value={seedPlayersCount}
                onChange={(e) => setSeedPlayersCount(e.target.value)}
                placeholder="players_count"
              />
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 140 }}
                value={seedTeamSize}
                onChange={(e) => setSeedTeamSize(e.target.value)}
                placeholder="team_size"
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() =>
                  runAction(async () => {
                    const playersCount = Number(seedPlayersCount);
                    const teamSize = Number(seedTeamSize);
                    if (!Number.isFinite(playersCount) || !Number.isFinite(teamSize)) {
                      throw new Error("players_count e team_size devem ser numericos");
                    }
                    await seedPartidaEvento(
                      eventoId,
                      { mode: "arrival_first", players_count: playersCount, team_size: teamSize },
                      auth,
                      makeIdempotencyKey(),
                    );
                  }, "Seed de partida executado")
                }
              >
                Rodar seed
              </button>
            </div>
          </div>
        )}

        {caps.has("lances") && (
          <div className="border rounded p-2 mb-3">
            <strong className="d-block mb-2">Registrar lance</strong>
            <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 120 }}
                placeholder="partidaId"
                value={partidaId}
                onChange={(e) => setPartidaId(e.target.value)}
              />
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 140 }}
                placeholder="tipo"
                value={lanceTipo}
                onChange={(e) => setLanceTipo(e.target.value)}
              />
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 140 }}
                placeholder="jogadorId (opcional)"
                value={lanceJogadorId}
                onChange={(e) => setLanceJogadorId(e.target.value)}
              />
            </div>
            <textarea
              className="form-control form-control-sm mb-2"
              rows={2}
              value={lancePayloadJson}
              onChange={(e) => setLancePayloadJson(e.target.value)}
            />
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 320 }}
                value={lanceClientEventId}
                onChange={(e) => setLanceClientEventId(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() =>
                  runAction(async () => {
                    const id = Number(partidaId);
                    if (!Number.isFinite(id)) {
                      throw new Error("Informe partidaId valido");
                    }
                    const payload = JSON.parse(lancePayloadJson) as Record<string, unknown>;
                    await criarLancePartida(
                      id,
                      {
                        tipo: lanceTipo,
                        payload,
                        jogador_id: lanceJogadorId ? Number(lanceJogadorId) : undefined,
                        client_event_id: lanceClientEventId || makeIdempotencyKey(),
                      },
                      auth,
                    );
                    setLanceClientEventId(makeIdempotencyKey());
                  }, "Lance registrado")
                }
              >
                Enviar lance
              </button>
            </div>
          </div>
        )}

        {caps.has("participants_view") && (
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <strong>Participantes</strong>
              {loadingLists ? (
                <p className="text-muted mb-0">Carregando...</p>
              ) : (
                <ul className="mb-0 mt-1">
                  {participants.length === 0 ? <li className="text-muted">Nenhum</li> : null}
                  {participants.map((item) => (
                    <li key={`p-${item}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="col-12 col-md-6">
              <strong>Presentes</strong>
              {loadingLists ? (
                <p className="text-muted mb-0">Carregando...</p>
              ) : (
                <ul className="mb-0 mt-1">
                  {presentes.length === 0 ? <li className="text-muted">Nenhum</li> : null}
                  {presentes.map((item) => (
                    <li key={`pr-${item}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
