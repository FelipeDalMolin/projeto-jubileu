// src/pages/dias/AulaPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obterDiaPorData } from "../../services/diasService";
import type { AulaDia, Dia, PresencaJogadorDia } from "../../types/dia";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AulaPage() {
  const { dataIso, aulaId } = useParams<{ dataIso: string; aulaId: string }>();
  const navigate = useNavigate();
  const [dia, setDia] = useState<Dia | null>(null);
  const [aula, setAula] = useState<AulaDia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataIso || !aulaId) return;
    setLoading(true);
    obterDiaPorData(dataIso)
      .then((result) => {
        setDia(result);
        if (result) {
          const a = result.aulas.find((x) => x.id === aulaId) ?? null;
          setAula(a);
        }
      })
      .finally(() => setLoading(false));
  }, [dataIso, aulaId]);

  if (!dataIso || !aulaId) {
    return <div style={{ padding: 24 }}>Parâmetros inválidos.</div>;
  }

  const dataObj = parseISO(dataIso);
  const tituloData = format(dataObj, "dd/MM/yyyy", { locale: ptBR });

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate(`/dias/${dataIso}`)}>&larr; Voltar</button>
        <h1>Aula</h1>
        <p>Carregando dados da aula...</p>
      </div>
    );
  }

  if (!dia || !aula) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate(`/dias/${dataIso}`)}>&larr; Voltar</button>
        <h1>Aula não encontrada</h1>
        <p>
          Não foi possível localizar a aula selecionada para o dia {tituloData}.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate(`/dias/${dataIso}`)}>
        &larr; Voltar para o dia
      </button>

      <header style={{ marginTop: 12, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#555" }}>
          Dia {tituloData} &bull; {aula.turmaNome}
        </div>
        <h1 style={{ margin: 0 }}>
          Aula #{aula.numeroAulaNaTurma} – {aula.turmaNome}
        </h1>
        <div style={{ fontSize: 13, color: "#555" }}>
          {aula.horarioInicio} – {aula.horarioFim}
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) minmax(360px, 1fr)",
          gap: 24,
        }}
      >
        {/* Coluna esquerda – jogadores e presença */}
        <section
          style={{
            borderRadius: 12,
            border: "1px solid #dde1e7",
            padding: 16,
            background: "#fff",
            maxHeight: "70vh",
            overflow: "auto",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Jogadores da turma</h2>

          {aula.jogadores.length === 0 ? (
            <p style={{ color: "#555" }}>
              Nenhum jogador associado a esta turma ainda.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Marcar todos como PRESENTE
                </button>
                <button
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Limpar presença
                </button>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 6px",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Jogador
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 6px",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Presença
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {aula.jogadores.map((j) => (
                    <LinhaJogador key={j.jogadorId} jogador={j} />
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        {/* Coluna direita – equipes e partidas */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #dde1e7",
              padding: 16,
              background: "#fff",
              minHeight: 160,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Equipes</h2>
            <p style={{ fontSize: 13, color: "#555" }}>
              Aqui entra a gestão visual das equipes (por exemplo, colunas com
              drag-and-drop). Por enquanto, esta seção é apenas um placeholder.
            </p>
          </div>

          <div
            style={{
              borderRadius: 12,
              border: "1px solid #dde1e7",
              padding: 16,
              background: "#fff",
              minHeight: 160,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Partidas</h2>
            <p style={{ fontSize: 13, color: "#555" }}>
              Depois de definir as equipes, você poderá cadastrar aqui as
              partidas (Time A x Time B), placares e estatísticas.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

type LinhaJogadorProps = {
  jogador: PresencaJogadorDia;
};

function LinhaJogador({ jogador }: LinhaJogadorProps) {
  // Depois a gente troca por botõezinhos P/F/A/C; por enquanto
  // só mostra o status textual para não complicar.
  return (
    <tr>
      <td
        style={{
          padding: "4px 6px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {jogador.nome}
      </td>
      <td
        style={{
          padding: "4px 6px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {jogador.status}
      </td>
    </tr>
  );
}
