import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  obterTurma,
  criarTurma,
  atualizarTurma,
  listarJogadoresDaTurma,
  adicionarJogadorNaTurma,
  removerJogadorDaTurma,
  type Turma,
} from "../../services/turmasService";
import { listarJogadores, type JogadorDTO } from "../../services/jogadoresService";

type RouteParams = { turmaId: string };
type TurmaJogador = {
  id: number;
  nome: string;
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function TurmaDetalhePage() {
  const { turmaId } = useParams<RouteParams>();
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
  const [novoJogadorId, setNovoJogadorId] = useState<number | "">("");

  async function recarregarJogadoresTurma(id: number) {
    const lista = await listarJogadoresDaTurma(id);
    setJogadoresTurma(lista);
  }

  useEffect(() => {
    let alive = true;

    async function carregar() {
      setLoading(true);
      setErro(null);

      try {
        // sempre carregar jogadores para o seletor
        const all = await listarJogadores();
        if (!alive) return;
        setTodosJogadores(all);

        if (ehNova) {
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

        await recarregarJogadoresTurma(t.id);
      } catch (e: unknown) {
        console.error(e);
        setErro(errorMessage(e, "Falha ao carregar dados da turma."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    carregar();
    return () => {
      alive = false;
    };
  }, [ehNova, turmaIdNum]);

  const jogadoresDisponiveis = useMemo(() => {
    const setIds = new Set(jogadoresTurma.map((jt) => jt.id)); // backend retorna JogadorOut -> id
    return todosJogadores.filter((j) => !setIds.has(j.id));
  }, [todosJogadores, jogadoresTurma]);

  async function handleSalvarTurma() {
    setErro(null);
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      setErro("Informe o nome da turma.");
      return;
    }

    try {
      if (ehNova) {
        const criada = await criarTurma({ nome: nomeTrim });
        // vai para a turma criada
        navigate(`/turmas/${criada.id}`, { replace: true });
        return;
      }

      if (!turma) return;
      const atualizada = await atualizarTurma(turma.id, { nome: nomeTrim });
      setTurma(atualizada);
    } catch (e: unknown) {
      console.error(e);
      setErro(errorMessage(e, "Erro ao salvar turma."));
    }
  }

  async function handleAdicionarJogador() {
    if (!turma || !novoJogadorId) return;
    setErro(null);
    try {
      await adicionarJogadorNaTurma(turma.id, Number(novoJogadorId));
      await recarregarJogadoresTurma(turma.id);
      setNovoJogadorId("");
    } catch (e: unknown) {
      console.error(e);
      setErro(errorMessage(e, "Erro ao adicionar jogador."));
    }
  }

  async function handleRemoverJogador(jogadorId: number) {
    if (!turma) return;
    setErro(null);
    try {
      await removerJogadorDaTurma(turma.id, jogadorId);
      await recarregarJogadoresTurma(turma.id);
    } catch (e: unknown) {
      console.error(e);
      setErro(errorMessage(e, "Erro ao remover jogador."));
    }
  }

  if (loading) {
    return <main className="container py-3">Carregando...</main>;
  }

  return (
    <main className="container py-3">
      <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/turmas")}>
        ← Voltar
      </button>

      {erro && <p className="text-danger">{erro}</p>}

      <h1 className="h4 mb-3">{ehNova ? "Nova turma" : `Turma: ${turma?.nome ?? ""}`}</h1>

      <div className="mb-3">
        <label className="form-label">Nome</label>
        <input className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div className="d-flex gap-2 mb-4">
        <button className="btn btn-outline-secondary" onClick={() => navigate("/turmas")}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleSalvarTurma}>
          {ehNova ? "Criar turma" : "Salvar alterações"}
        </button>
      </div>

      {!ehNova && turma && (
        <>
          <section className="mb-4">
            <h2 className="h6">Adicionar jogador</h2>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={novoJogadorId}
                onChange={(e) => {
                  const v = e.target.value;
                  setNovoJogadorId(v ? Number(v) : "");
                }}
              >
                <option value="">Selecione</option>
                {jogadoresDisponiveis.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nome}
                  </option>
                ))}
              </select>
              <button className="btn btn-sm btn-primary" disabled={!novoJogadorId} onClick={handleAdicionarJogador}>
                Adicionar
              </button>
            </div>
          </section>

          <section>
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="h6 mb-2">Jogadores da turma</h2>
              <small className="text-muted">{jogadoresTurma.length} vinculados</small>
            </div>

            {jogadoresTurma.length === 0 ? (
              <p className="text-muted">Nenhum jogador vinculado.</p>
            ) : (
              <table className="table table-sm">
                <tbody>
                  {jogadoresTurma.map((j) => (
                    <tr key={j.id}>
                      <td>{j.nome}</td>
                      <td className="text-end">
                        <button className="btn btn-link btn-sm text-danger" onClick={() => handleRemoverJogador(j.id)}>
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {ehNova && (
        <p className="text-muted" style={{ fontSize: 12 }}>
          Dica: crie a turma primeiro. Depois você vincula jogadores nela.
        </p>
      )}
    </main>
  );
}
