import { useEffect, useMemo, useState } from "react";
import type { AulaDia, PresencaJogadorDia, TimeDia } from "../../types/dia";
import {
  carregarEstadoEquipesAula,
  salvarEstadoEquipesAula,
  criarTimeNaAula,
} from "../../services/diasService";

type Props = {
  dataIso: string;
  aula: AulaDia;
};

export default function DiaEquipesTab({ dataIso, aula }: Props) {
  const [jogadores, setJogadores] = useState<PresencaJogadorDia[]>([]);
  const [times, setTimes] = useState<TimeDia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [novoTimeNome, setNovoTimeNome] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);

    carregarEstadoEquipesAula(dataIso, aula.id)
      .then((snap) => {
        if (!ativo) return;

        if (snap) {
          setJogadores(snap.jogadores ?? []);
          setTimes(snap.times ?? []);
        } else {
          setJogadores(aula.jogadores ?? []);
          setTimes(aula.times ?? []);
        }
      })
      .catch((err) => {
        console.error(err);
        if (ativo) {
          setJogadores(aula.jogadores ?? []);
          setTimes(aula.times ?? []);
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [dataIso, aula.id, aula.jogadores, aula.times]);

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
      await salvarEstadoEquipesAula(
        dataIso,
        aula.id,
        jogadoresAtualizados,
        timesAtualizados,
      );
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
    setJogadores(novos);
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
      const novo = await criarTimeNaAula(dataIso, aula.id, { nome });
      const timesAtualizados = [...times, novo];
      setTimes(timesAtualizados);
      setNovoTimeNome("");
      await salvarEstado(jogadores, timesAtualizados);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao criar time.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
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
    </div>
  );
}
