// src/pages/dias/DiaEquipesTab.tsx
import { useEffect, useState } from "react";
import type { AulaDia, PresencaJogadorDia } from "../../types/dia";
import type {
  EstadoEquipesDia,
  JogadorEquipeView,
  EquipeView,
} from "../../types/equipes";
import {
  obterEstadoEquipes,
  salvarEstadoEquipes,
} from "../../services/equipesService";

type Props = {
  aula: AulaDia;
};

function montarEstadoInicial(aula: AulaDia): EstadoEquipesDia {
  const diaId = aula.id;

  const jogadores: JogadorEquipeView[] = aula.jogadores.map(
    (pj: PresencaJogadorDia) => ({
      id: pj.jogadorId,
      nome: pj.nome,
      equipeId: null,
    })
  );

  const equipes: EquipeView[] = aula.times.map((t, index) => ({
    id: index + 1,
    nome: t.nome,
  }));

  return {
    diaId,
    jogadores,
    equipes,
    atribuicoes: [],
  };
}

export default function DiaEquipesTab({ aula }: Props) {
  const chaveAula = aula.id;

  const [estado, setEstado] = useState<EstadoEquipesDia | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Carrega do backend + polling
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const daApi = await obterEstadoEquipes(chaveAula);

        if (daApi.jogadores.length === 0 && aula.jogadores.length > 0) {
          const inicial = montarEstadoInicial(aula);
          const salvo = await salvarEstadoEquipes(chaveAula, inicial);
          if (!ativo) return;
          setEstado(salvo);
        } else {
          if (!ativo) return;
          setEstado(daApi);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    const intervalId = setInterval(() => {
      obterEstadoEquipes(chaveAula)
        .then((nov) => {
          if (!ativo) return;
          setEstado(nov);
        })
        .catch((e) => console.error(e));
    }, 3000);

    return () => {
      ativo = false;
      clearInterval(intervalId);
    };
  }, [chaveAula, aula]);

  async function moverJogador(
    jogadorId: number,
    novaEquipeId: number | null
  ): Promise<void> {
    if (!estado) return;

    const novasAtribuicoes = [
      ...estado.atribuicoes.filter((a) => a.jogadorId !== jogadorId),
      { jogadorId, equipeId: novaEquipeId },
    ];

    const novosJogadores = estado.jogadores.map((j) =>
      j.id === jogadorId ? { ...j, equipeId: novaEquipeId } : j
    );

    const novoEstado: EstadoEquipesDia = {
      ...estado,
      jogadores: novosJogadores,
      atribuicoes: novasAtribuicoes,
    };

    setEstado(novoEstado);

    try {
      await salvarEstadoEquipes(chaveAula, novoEstado);
    } catch (e) {
      console.error(e);
    }
  }

  if (carregando || !estado) {
    return <div>Carregando equipes...</div>;
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ minWidth: 260 }}>
        <h3>Jogadores disponíveis (sincronizado)</h3>
        <ul style={{ paddingLeft: 16 }}>
          {estado.jogadores
            .filter((j) => j.equipeId === null)
            .map((j) => (
              <li key={j.id} style={{ marginBottom: 4 }}>
                {j.nome}
                {estado.equipes.map((e) => (
                  <button
                    key={e.id}
                    style={{ marginLeft: 8 }}
                    onClick={() => moverJogador(j.id, e.id)}
                  >
                    Mandar para {e.nome}
                  </button>
                ))}
              </li>
            ))}
        </ul>
      </div>

      {estado.equipes.map((e) => (
        <div key={e.id} style={{ minWidth: 220 }}>
          <h3>{e.nome}</h3>
          <ul style={{ paddingLeft: 16 }}>
            {estado.jogadores
              .filter((j) => j.equipeId === e.id)
              .map((j) => (
                <li key={j.id} style={{ marginBottom: 4 }}>
                  {j.nome}
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => moverJogador(j.id, null)}
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
