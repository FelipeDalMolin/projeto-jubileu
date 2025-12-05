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
  /**
   * A aba de equipes trabalha em cima de UMA aula específica do dia.
   * Ex.: aula-adulto-22, aula-sub11-01 etc.
   */
  aula: AulaDia;
};

/**
 * Constrói um estado inicial de equipes a partir da AULA.
 * Aqui usamos:
 * - jogadores: aula.jogadores (PresencaJogadorDia)
 * - equipes: aula.times (TimeDia)
 *
 * Obs.: para simplificar, os IDs das equipes são índices numéricos (1,2,3...),
 * independentes dos `time.id` (que são string). Para o usuário, o que aparece
 * é o `nome` da equipe.
 */
function montarEstadoInicial(aula: AulaDia): EstadoEquipesDia {
  const diaId = aula.id; // vamos usar o ID da aula como chave no backend

  const jogadores: JogadorEquipeView[] = aula.jogadores.map(
    (pj: PresencaJogadorDia) => ({
      id: pj.jogadorId,
      nome: pj.nome,
      // para primeira versão, todo mundo começa sem equipe
      equipeId: null,
    })
  );

  const equipes: EquipeView[] = aula.times.map((t, index) => ({
    id: index + 1, // 1,2,3...
    nome: t.nome,
  }));

  return {
    diaId, // aqui "diaId" na verdade é a chave da aula na API
    jogadores,
    equipes,
    atribuicoes: [],
  };
}

export default function DiaEquipesTab({ aula }: Props) {
  // usamos o id da aula como chave no backend
  const chaveAula = aula.id;

  const [estado, setEstado] = useState<EstadoEquipesDia | null>(null);
  const [carregando, setCarregando] = useState(true);

  // 1) Carregar do backend + iniciar polling
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const daApi = await obterEstadoEquipes(chaveAula);

        if (daApi.jogadores.length === 0 && aula.jogadores.length > 0) {
          // primeira vez: monta a partir da aula e salva
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
    }, 3000); // atualiza a cada 3s

    return () => {
      ativo = false;
      clearInterval(intervalId);
    };
  }, [chaveAula, aula]);

  // 2) Mover jogador entre equipes (ou para "sem equipe")
  async function moverJogador(jogadorId: number, novaEquipeId: number | null) {
    if (!estado) return;

    const novasAtribuicoes = [
      ...estado.atribuicoes.filter((a) => a.jogadorId !== jogadorId),
      { jogadorId, equipeId: novaEquipeId },
    ];

    const novosJogadores = estado.jogadores.map((j: JogadorEquipeView) =>
      j.id === jogadorId ? { ...j, equipeId: novaEquipeId } : j
    );

    const novoEstado: EstadoEquipesDia = {
      ...estado,
      jogadores: novosJogadores,
      atribuicoes: novasAtribuicoes,
    };

    // otimista: já atualiza a tela
    setEstado(novoEstado);

    try {
      await salvarEstadoEquipes(chaveAula, novoEstado);
    } catch (e) {
      console.error(e);
      // se quiser, aqui poderia fazer rollback
    }
  }

  if (carregando || !estado) {
    return <div>Carregando equipes...</div>;
  }

  // 3) Renderização simples: jogadores sem equipe + colunas de equipes
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ minWidth: 240 }}>
        <h3>Jogadores disponíveis</h3>
        <ul>
          {estado.jogadores
            .filter((j) => j.equipeId === null)
            .map((j) => (
              <li key={j.id} style={{ marginBottom: 4 }}>
                {j.nome}
                {estado.equipes.map((equipe) => (
                  <button
                    key={equipe.id}
                    style={{ marginLeft: 8 }}
                    onClick={() => moverJogador(j.id, equipe.id)}
                  >
                    Mandar para {equipe.nome}
                  </button>
                ))}
              </li>
            ))}
        </ul>
      </div>

      {estado.equipes.map((equipe) => (
        <div key={equipe.id} style={{ minWidth: 220 }}>
          <h3>{equipe.nome}</h3>
          <ul>
            {estado.jogadores
              .filter((j) => j.equipeId === equipe.id)
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
