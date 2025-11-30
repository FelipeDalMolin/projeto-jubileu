// src/pages/turmas/TurmaPage.tsx
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Turma } from "../../types/domain";
import { MOCK_TURMAS, MOCK_JOGADORES } from "./MockTurmas";

function formatarRecorrencia(recorrencia: Turma["recorrencia"]) {
  const labels: Record<string, string> = {
    SEG: "Seg",
    TER: "Ter",
    QUA: "Qua",
    QUI: "Qui",
    SEX: "Sex",
    SAB: "Sáb",
    DOM: "Dom",
  };

  return recorrencia.map((dia) => labels[dia] ?? dia).join(" / ");
}

export default function TurmaPage() {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();

  const turma = useMemo(
    () => MOCK_TURMAS.find((item) => item.id === Number(turmaId)),
    [turmaId]
  );

  const jogadoresDaTurma = useMemo(() => {
    if (!turma) return [];
    return MOCK_JOGADORES.filter((j) => turma.jogadoresIds.includes(j.id));
  }, [turma]);

  if (!turma) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Turma não encontrada</h2>
        <p>Verifique o identificador informado e tente novamente.</p>
        <button onClick={() => navigate("/turmas")}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      {/* Cabeçalho da turma */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <button
            onClick={() => navigate("/turmas")}
            style={{
              marginBottom: 8,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            &larr; Voltar para turmas
          </button>
          <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>Turma</p>
          <h2 style={{ margin: "2px 0" }}>{turma.nome}</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            Recorrência:{" "}
            <strong>{formatarRecorrencia(turma.recorrencia)}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
            }}
          >
            Adicionar jogador à turma
          </button>
          <button
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
            }}
          >
            Remover jogador da turma
          </button>
        </div>
      </div>

      {/* Jogadores vinculados */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Jogadores vinculados</h3>

        {jogadoresDaTurma.length === 0 ? (
          <p style={{ color: "#475569" }}>Nenhum jogador vinculado ainda.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <th style={{ padding: "8px 4px" }}>Nome</th>
                  <th style={{ padding: "8px 4px" }}>Apelido</th>
                  <th style={{ padding: "8px 4px" }}>Posição</th>
                  <th style={{ padding: "8px 4px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {jogadoresDaTurma.map((jogador) => (
                  <tr
                    key={jogador.id}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={{ padding: "10px 4px" }}>{jogador.nome}</td>
                    <td style={{ padding: "10px 4px" }}>
                      {jogador.apelido ?? "-"}
                    </td>
                    <td style={{ padding: "10px 4px" }}>
                      {jogador.posicao2 ?? "-"}
                    </td>
                    <td style={{ padding: "10px 4px", fontSize: 12 }}>
                      {jogador.status === "ativo" && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#dcfce7",
                            border: "1px solid #22c55e",
                          }}
                        >
                          Ativo
                        </span>
                      )}
                      {jogador.status === "temporariamente_inativo" && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#fef9c3",
                            border: "1px solid #facc15",
                          }}
                        >
                          Temporariamente inativo
                        </span>
                      )}
                      {jogador.status === "desligado" && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#fee2e2",
                            border: "1px solid #ef4444",
                          }}
                        >
                          Desligado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
