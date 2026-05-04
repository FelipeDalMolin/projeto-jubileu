import { useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { seedPartidaEvento, type AuthHeaders } from "../../../services/eventosService";
import type { EventoCapability } from "../capabilities";

type Props = {
  auth: AuthHeaders | null;
  caps: Set<EventoCapability>;
  eventoId: number;
  presentesCount: number;
  onSeeded: () => Promise<void>;
};

export function SeedPartidaCard({ auth, caps, eventoId, presentesCount, onSeeded }: Props) {
  const [teamSize, setTeamSize] = useState("1");
  const [playersCount, setPlayersCount] = useState("2");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canSeed = Boolean(auth && caps.has("seed_partida"));

  async function onSubmit() {
    if (!auth) return;
    setError(null);
    setInfo(null);
    const parsedTeamSize = Number(teamSize);
    const parsedPlayersCount = Number(playersCount);
    if (!Number.isFinite(parsedTeamSize) || parsedTeamSize <= 0) {
      setError("Informe um team_size valido.");
      return;
    }
    if (!Number.isFinite(parsedPlayersCount) || parsedPlayersCount <= 1) {
      setError("Informe um players_count valido.");
      return;
    }
    if (parsedPlayersCount !== parsedTeamSize * 2) {
      setError("players_count precisa ser team_size x 2.");
      return;
    }
    if (parsedPlayersCount > presentesCount) {
      setError("players_count nao pode ultrapassar o total de presentes.");
      return;
    }

    setIsSubmitting(true);
    try {
      await seedPartidaEvento(
        eventoId,
        {
          mode: "arrival_first",
          players_count: parsedPlayersCount,
          team_size: parsedTeamSize,
        },
        auth,
      );
      setInfo("Primeira partida criada e iniciada com sucesso.");
      await onSeeded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao seed de partida");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Seed de Partida</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!canSeed ? (
          <div className="rounded-md bg-slate-100 p-2 text-sm text-slate-700">
            Seed disponivel apenas para perfis com permissao de administracao.
          </div>
        ) : null}
        <div className="text-xs text-muted-foreground">Presentes CHECKED_IN: {presentesCount}</div>
        {error ? <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        {info ? <div className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{info}</div> : null}
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            team_size
            <Input
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              disabled={!canSeed || isSubmitting}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            players_count
            <Input
              value={playersCount}
              onChange={(e) => setPlayersCount(e.target.value)}
              disabled={!canSeed || isSubmitting}
            />
          </label>
        </div>
        <Button onClick={onSubmit} disabled={!canSeed || isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar primeira partida"}
        </Button>
      </CardContent>
    </Card>
  );
}
