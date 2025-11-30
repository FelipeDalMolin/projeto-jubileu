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
    <div className="page-container" style={{ display: "grid", gap: 16 }}>
      {/* Cabeçalho */}
      <div className="page-header">
        <div>
          <p className="page-header-subtitle">Gestão</p>
          <h2 className="page-header-title">Turmas</h2>
        </div>

        <button className="btn btn-primary">+ Nova turma</button>
      </div>

      {/* Tabela de turmas */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Lista de turmas</h3>
          <p className="card-subtitle">
            {MOCK_JOGADORES.length} jogadores cadastrados
          </p>
        </div>

        <div className="table-responsive mt-12">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Recorrência</th>
                <th>Qtd. jogadores</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {turmasComQuantidade.map((turma) => (
                <tr key={turma.id}>
                  <td style={{ fontWeight: 600 }}>{turma.nome}</td>
                  <td className="text-muted">
                    {formatarRecorrencia(turma.recorrencia)}
                  </td>
                  <td>{turma.quantidadeJogadores}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/turmas/${turma.id}`)}
                      className="btn btn-ghost btn-sm"
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
