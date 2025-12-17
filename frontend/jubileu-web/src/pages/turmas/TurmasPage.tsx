import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarTurmas, type Turma } from "../../services/turmasService";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarTurmas()
      .then(setTurmas)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Turmas</h1>
        <Link className="btn btn-primary btn-sm" to="/turmas/nova">
          + Nova turma
        </Link>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : turmas.length === 0 ? (
        <p className="text-muted">Nenhuma turma cadastrada.</p>
      ) : (
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Nome</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((t) => (
              <tr key={t.id}>
                <td>{t.nome}</td>
                <td className="text-end">
                  <Link to={`/turmas/${t.id}`} className="btn btn-outline-primary btn-sm">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
