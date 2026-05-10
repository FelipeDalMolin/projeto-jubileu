import { useMemo, useState } from "react";
import type { EventoDia, PresencaJogadorDia, TimeDia } from "../../types/dia";
import { salvarEstadoEquipesEvento, criarTimeNoEvento } from "../../services/diasService";
import { useEventoEstadoPolling } from "../../hooks/useEventoEstadoPolling";

type Props = {
  dataIso: string;
  evento: EventoDia;
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function DiaEquipesTab({ dataIso, evento }: Props) {
  const [salvando, setSalvando] = useState(false);
  const [novoTimeNome, setNovoTimeNome] = useState("");

  const { estado, setEstado, loading, refreshNow, error } = useEventoEstadoPolling({
    dataIso,
    eventoId: Number(evento.id),
    enabled: true,
  });

  const normalizeTimeId = (id: string) => (id.startsWith("time-") ? id : `time-${id}`);

  const equipes = useMemo(() => {
    const baseJogadores = estado?.equipes?.jogadores ?? evento.jogadores ?? [];
    const baseTimes = estado?.equipes?.times ?? evento.times ?? [];

    const timesNorm: TimeDia[] = baseTimes.map((t) => ({
      ...t,
      id: normalizeTimeId(t.id),
    }));

    const jogadoresNorm: PresencaJogadorDia[] = baseJogadores.map((j) => ({
      ...j,
      timeId: j.timeId ? normalizeTimeId(j.timeId) : undefined,
    }));

    return { jogadores: jogadoresNorm, times: timesNorm };
  }, [estado, evento.jogadores, evento.times]);

  const jogadores = equipes.jogadores;
  const times = equipes.times;

  const jogadoresDisponiveis = useMemo(
    () => jogadores.filter((j) => !j.timeId),
    [jogadores],
  );

  async function salvarEstado(
    jogadoresAtualizados: PresencaJogadorDia[],
    timesAtualizados: TimeDia[],
  ) {
    setSalvando(true);
    try {
      await salvarEstadoEquipesEvento(dataIso, evento.id, jogadoresAtualizados, timesAtualizados);
      refreshNow();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar estado das equipes.");
    } finally {
      setSalvando(false);
    }
  }

  async function moverJogador(
    jogadorId: number,
    novoTimeId: string | null,
  ) {
    const novos = jogadores.map((j) =>
      j.jogadorId === jogadorId ? { ...j, timeId: novoTimeId ?? undefined } : j,
    );

    setEstado((prev) =>
      prev
        ? {
            ...prev,
            equipes: { ...prev.equipes, jogadores: novos },
          }
        : prev,
    );

    await salvarEstado(novos, times);
  }

  async function handleCriarTime() {
    const nome = novoTimeNome.trim();
    if (!nome) {
      alert("Informe um nome para o time.");
      return;
    }

    try {
      setSalvando(true);
      const novo = await criarTimeNoEvento(dataIso, evento.id, { nome });
      const timeId = normalizeTimeId(novo.id);
      const timesAtualizados = [...times, { ...novo, id: timeId }];
      setNovoTimeNome("");

      setEstado((prev) =>
        prev
          ? {
              ...prev,
              equipes: { ...prev.equipes, times: timesAtualizados },
            }
          : prev,
      );

      await salvarEstado(jogadores, timesAtualizados);
      await refreshNow();
    } catch (err: unknown) {
      console.error(err);
      alert(errorMessage(err, "Erro ao criar time."));
    } finally {
      setSalvando(false);
    }
  }

  if (loading && !estado) {
    return <p>Carregando equipes...</p>;
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ minWidth: 260 }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Novo time"
            value={novoTimeNome}
            onChange={(e) => setNovoTimeNome(e.target.value)}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCriarTime}
            disabled={salvando}
          >
            Adicionar
          </button>
        </div>

        <h3>Jogadores disponiveis</h3>
        <ul style={{ paddingLeft: 16 }}>
          {jogadoresDisponiveis.map((j) => (
            <li key={j.jogadorId} style={{ marginBottom: 4 }}>
              {j.nome}
              {times.map((t) => (
                <button
                  key={t.id}
                  className="btn btn-link btn-sm"
                  style={{ marginLeft: 8 }}
                  onClick={() => moverJogador(j.jogadorId, t.id)}
                  disabled={salvando}
                >
                  Mandar para {t.nome}
                </button>
              ))}
            </li>
          ))}
        </ul>
      </div>

      {times.map((t) => (
        <div key={t.id} style={{ minWidth: 220 }}>
          <h3>{t.nome}</h3>
          <ul style={{ paddingLeft: 16 }}>
            {jogadores
              .filter((j) => j.timeId === t.id)
              .map((j) => (
                <li key={j.jogadorId} style={{ marginBottom: 4 }}>
                  {j.nome}
                  <button
                    className="btn btn-link btn-sm"
                    style={{ marginLeft: 8 }}
                    onClick={() => moverJogador(j.jogadorId, null)}
                    disabled={salvando}
                  >
                    Remover
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}

      {error && (
        <div className="text-danger" style={{ fontSize: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}
