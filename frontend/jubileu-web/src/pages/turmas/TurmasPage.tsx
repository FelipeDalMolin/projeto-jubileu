import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { criarTurma, listarTurmas, type Turma } from "../../services/turmasService";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state para criação
  const [showCreate, setShowCreate] = useState(false);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await listarTurmas();
      setTurmas(data);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erro ao listar turmas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCriarTurma(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      setErrorMsg("Informe o nome da turma.");
      return;
    }

    setSaving(true);
    try {
      const nova = await criarTurma({ nome: nomeTrim });
      // Atualiza lista imediatamente (sem depender de novo GET)
      setTurmas((prev) => [nova, ...prev]);
      setNome("");
      setShowCreate(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erro ao criar turma");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container py-3" data-testid="page-turmas">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Turmas</h1>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setErrorMsg(null);
            setShowCreate((v) => !v);
          }}
        >
          + Nova turma
        </button>
      </div>

      {showCreate && (
        <div className="card mb-3">
          <div className="card-body">
            <form data-testid="form-turma" onSubmit={handleCriarTurma} className="row g-2 align-items-end">
              <div className="col-12 col-md-8">
                <label htmlFor="turma-nome" className="form-label mb-1">
                  Nome da turma
                </label>
                <input
                  id="turma-nome"
                  name="turma-nome"
                  className="form-control"
                  placeholder="Ex: Sub-11, Adulto, Feminino..."
                  value={nome}
                  onChange={(ev) => setNome(ev.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="col-12 col-md-4 d-flex gap-2">
                <button data-testid="button-salvar-turma" type="submit" className="btn btn-success w-100" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setShowCreate(false);
                    setNome("");
                    setErrorMsg(null);
                  }}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </form>

            {errorMsg && <div className="alert alert-danger mt-3 mb-0">{errorMsg}</div>}
          </div>
        </div>
      )}

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

      {!loading && !showCreate && (
        <div className="mt-3">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={carregar}>
            Recarregar lista
          </button>
        </div>
      )}
    </main>
  );
}
