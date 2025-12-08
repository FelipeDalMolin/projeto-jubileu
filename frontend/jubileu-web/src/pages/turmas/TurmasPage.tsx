import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarTurmas } from "../../services/turmasService";
import type { Turma } from "../../types/turma";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarTurmas().then((dados) => {
      setTurmas(dados);
      setLoading(false);
    });
  }, []);

  return (
    <main className="container py-3">
      <h1 className="h3 mb-3">Turmas</h1>

      <div className="d-flex justify-content-end mb-3">
        <Link className="btn btn-primary btn-sm" to="/turmas/nova">
          + Nova turma
        </Link>
      </div>

      {loading ? (
        <p>Carregando turmas...</p>
      ) : turmas.length === 0 ? (
        <p className="text-muted">Nenhuma turma cadastrada ainda.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Participantes ativos</th>
                <th>Professores</th>
                <th style={{ width: 120 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {turmas.map((t) => {
                const ativos = t.participantes.filter((p) => p.ativo).length;
                const qtProfessores = t.participantes.filter(
                  (p) => p.papel === "professor" && p.ativo
                ).length;

                return (
                  <tr key={t.id}>
                    <td>{t.nome}</td>
                    <td>{t.categoria ?? "-"}</td>
                    <td>{ativos}</td>
                    <td>{qtProfessores}</td>
                    <td>
                      <Link
                        className="btn btn-outline-primary btn-sm"
                        to={`/turmas/${t.id}`}
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
