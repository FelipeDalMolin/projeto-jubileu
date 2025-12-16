import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  criarTurma,
  obterTurma,
  atualizarTurma,
  listarJogadoresDaTurma,
  type Turma,
  type TurmaJogador,
} from "../../services/turmasService";
import { listarJogadores, type JogadorDTO } from "../../services/jogadoresService";

export default function TurmaDetalhePage() {
  const { turmaId } = useParams<{ turmaId: string }>();
  const ehNova = turmaId === "nova";
  const navigate = useNavigate();

  const turmaIdNum = useMemo(() => {
    if (!turmaId || ehNova) return null;
    const n = Number(turmaId);
    return Number.isFinite(n) ? n : null;
  }, [turmaId, ehNova]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [turma, setTurma] = useState<Turma | null>(null);
  const [nome, setNome] = useState("");

  const [jogadoresTurma, setJogadoresTurma] = useState<TurmaJogador[]>([]);
  const [todosJogadores, setTodosJogadores] = useState<JogadorDTO[]>([]);

  useEffect(() => {
    let alive = true;

    async function carregar() {
      setLoading(true);
      setErro(null);

      try {
        // sempre podemos carregar a lista de jogadores do sistema (para futuro add/remove)
        const all = await listarJogadores();
        if (!alive) return;
        setTodosJogadores(all);

        if (ehNova) {
          // modo NOVA: não chama backend por id
          setTurma(null);
          setNome("");
          setJogadoresTurma([]);
          return;
        }

        if (!turmaIdNum) {
          setErro("Turma inválida.");
          return;
        }

        const t = await obterTurma(turmaIdNum);
        if (!alive) return;
        setTurma(t);
        setNome(t.nome);

        const jt = await listarJogadoresDaTurma(turmaIdNum);
        if (!alive) return;
        setJogadoresTurma(jt);
      } catch (e: any) {
        console.error(e);
        setErro("Falha ao carregar dados da turma. Veja o console.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    carregar();
    return () => {
      alive = false;
    };
  }, [ehNova, turmaIdNum]);

  async function onSalvar() {
    const nomeOk = nome.trim();
    if (!nomeOk) {
      alert("Informe o nome da turma.");
      return;
    }

    try {
      setLoading(true);

      if (ehNova) {
        const criada = await criarTurma({ nome: nomeOk });
        setTurma(criada);
        navigate(`/turmas/${criada.id}`, { replace: true });
        return;
      }

      if (!turmaIdNum) {
        alert("Turma inválida.");
        return;
      }

      const atualizada = await atualizarTurma(turmaIdNum, { nome: nomeOk });
      setTurma(atualizada);
      alert("Turma atualizada!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar. Veja o console.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/turmas")}>
          ← Voltar
        </button>
        <p>Carregando...</p>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="container py-3">
        <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/turmas")}>
          ← Voltar
        </button>
        <p style={{ color: "crimson" }}>{erro}</p>
      </main>
    );
  }

  return (
    <main className="container py-3">
      <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/turmas")}>
        ← Voltar
      </button>

      <h1 className="h4 mb-3">{ehNova ? "Nova turma" : `Turma: ${turma?.nome ?? ""}`}</h1>

      <section className="card" style={{ padding: 16, marginBottom: 16 }}>
        <label className="form-label">Nome</label>
        <input
          className="form-control"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Adulto Ter/Qui 18:45"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/turmas")}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={onSalvar}>
            {ehNova ? "Criar turma" : "Salvar alterações"}
          </button>
        </div>
      </section>

      {!ehNova && (
        <section className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 className="h6" style={{ margin: 0 }}>
              Jogadores da turma
            </h2>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {jogadoresTurma.length} vinculados
            </span>
          </div>

          {jogadoresTurma.length === 0 ? (
            <p className="text-muted" style={{ marginTop: 12 }}>
              Nenhum jogador vinculado ainda.
            </p>
          ) : (
            <div className="table-responsive" style={{ marginTop: 12 }}>
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Apelido</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jogadoresTurma.map((j) => (
                    <tr key={j.id}>
                      <td>{j.nome}</td>
                      <td>{j.apelido ?? "-"}</td>
                      <td>{j.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Futuro: aqui entra "Adicionar / Remover jogador", quando existir endpoint no backend */}
          <p className="text-muted" style={{ fontSize: 12, marginTop: 12 }}>
            Próximo passo: criar endpoints para vincular/desvincular jogadores na turma (POST/DELETE),
            e então habilitar o seletor aqui.
          </p>
        </section>
      )}
    </main>
  );
}
