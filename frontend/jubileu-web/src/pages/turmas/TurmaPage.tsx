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
      <div className="page-container">
        <div className="card">
          <h2>Turma não encontrada</h2>
          <p>Verifique o identificador informado e tente novamente.</p>
          <button className="btn btn-ghost" onClick={() => navigate("/turmas")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: "grid", gap: 16 }}>
      {/* Cabeçalho da turma */}
      <div className="page-header">
        <div>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => navigate("/turmas")}
            style={{ marginBottom: 8 }}
          >
            &larr; Voltar para turmas
          </button>
          <p className="page-header-subtitle" style={{ margin: 0 }}>
            Turma
          </p>
          <h2 className="page-header-title" style={{ margin: "2px 0" }}>
            {turma.nome}
          </h2>
          <p className="page-header-subtitle" style={{ margin: 0 }}>
            Recorrência: <strong>{formatarRecorrencia(turma.recorrencia)}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ghost">Adicionar jogador à turma</button>
          <button className="btn btn-ghost">Remover jogador da turma</button>
        </div>
      </div>

      {/* Jogadores vinculados */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Jogadores vinculados</h3>
        </div>

        {jogadoresDaTurma.length === 0 ? (
          <p className="text-muted">Nenhum jogador vinculado ainda.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Apelido</th>
                  <th>Posição</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jogadoresDaTurma.map((jogador) => (
                  <tr key={jogador.id}>
                    <td>{jogador.nome}</td>
                    <td>{jogador.apelido ?? "-"}</td>
                    <td>{jogador.posicao2 ?? "-"}</td>
                    <td style={{ fontSize: 12 }}>
                      {jogador.status === "ativo" && (
                        <span className="badge badge-success">Ativo</span>
                      )}
                      {jogador.status === "temporariamente_inativo" && (
                        <span className="badge badge-warning">
                          Temporariamente inativo
                        </span>
                      )}
                      {jogador.status === "desligado" && (
                        <span className="badge badge-danger">Desligado</span>
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
