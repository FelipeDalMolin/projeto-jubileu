// src/pages/turmas/TurmasPage.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

// Tipo auxiliar: Turma + campo calculado de quantidade de jogadores
type TurmaComQuantidade = Turma & {
  quantidadeJogadores: number;
};

export default function TurmasPage() {
  const navigate = useNavigate();

  const turmasComQuantidade = useMemo<TurmaComQuantidade[]>(
    () =>
      MOCK_TURMAS.map((turma) => ({
        ...turma,
        quantidadeJogadores: turma.jogadoresIds.length,
      })),
    []
  );

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      {/* Cabeçalho */}
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
          <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>Gestão</p>
          <h2 style={{ margin: 0 }}>Turmas</h2>
        </div>

        <button
          style={{
            background: "#22c55e",
            borderColor: "#bbf7d0",
            color: "#0f172a",
            padding: "8px 14px",
            borderRadius: 8,
            borderWidth: 1,
            cursor: "pointer",
          }}
        >
          + Nova turma
        </button>
      </div>

      {/* Tabela de turmas */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>Lista de turmas</h3>
          <p style={{ margin: 0, color: "#475569" }}>
            {MOCK_JOGADORES.length} jogadores cadastrados
          </p>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <th style={{ padding: "8px 4px" }}>Nome</th>
                <th style={{ padding: "8px 4px" }}>Recorrência</th>
                <th style={{ padding: "8px 4px" }}>Qtd. jogadores</th>
                <th style={{ padding: "8px 4px" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {turmasComQuantidade.map((turma) => (
                <tr
                  key={turma.id}
                  style={{ borderBottom: "1px solid #e2e8f0" }}
                >
                  <td style={{ padding: "10px 4px", fontWeight: 600 }}>
                    {turma.nome}
                  </td>
                  <td style={{ padding: "10px 4px", color: "#475569" }}>
                    {formatarRecorrencia(turma.recorrencia)}
                  </td>
                  <td style={{ padding: "10px 4px" }}>
                    {turma.quantidadeJogadores}
                  </td>
                  <td style={{ padding: "10px 4px" }}>
                    <button
                      onClick={() => navigate(`/turmas/${turma.id}`)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
