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
  type TurmaJogador,
} from "../../services/turmasService";
import { listarJogadores, type JogadorDTO } from "../../services/jogadoresService";

type RouteParams = {
  turmaId?: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";

export default function TurmaDetalhePage() {
  const { turmaId } = useParams<RouteParams>();
  const navigate = useNavigate();

  const ehNova = !turmaId || turmaId === "nova";
  const turmaIdNum = useMemo(() => {
    if (!turmaId || turmaId === "nova") return null;
    const n = Number(turmaId);
    return Number.isFinite(n) ? n : null;
  }, [turmaId]);

  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [turma, setTurma] = useState<Turma | null>(null);
  const [nome, setNome] = useState<string>("");

  const [jogadoresTurma, setJogadoresTurma] = useState<TurmaJogador[]>([]);
  const [todosJogadores, setTodosJogadores] = useState<JogadorDTO[]>([]);
  const [novoJogadorId, setNovoJogadorId] = useState<number | "">("");

  const [salvandoTurma, setSalvandoTurma] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [removendoId, setRemovendoId] = useState<number | null>(null);

  const jogadoresDisponiveis = useMemo(() => {
    const idsNaTurma = new Set(jogadoresTurma.map((j) => j.jogador_id));
    return todosJogadores.filter((j) => !idsNaTurma.has(j.id));
  }, [todosJogadores, jogadoresTurma]);

  async function carregarTudo(id: number) {
    const [t, jt, todos] = await Promise.all([
      obterTurma(id),
      listarJogadoresDaTurma(id),
      listarJogadores(),
    ]);
    setTurma(t);
    setNome(t.nome ?? "");
    setJogadoresTurma(jt);
    setTodosJogadores(todos);
  }

  async function carregarApenasListas(id: number) {
    const [jt, todos] = await Promise.all([
      listarJogadoresDaTurma(id),
      listarJogadores(),
    ]);
    setJogadoresTurma(jt);
    setTodosJogadores(todos);
  }

  useEffect(() => {
    let alive = true;

    async function run() {
      setErrorMsg(null);
      setState("loading");

      try {
        // Sempre carregamos a lista de jogadores (serve pra nova turma também)
        const todos = await listarJogadores();
        if (!alive) return;
        setTodosJogadores(todos);

        if (ehNova) {
          setTurma(null);
          setNome("");
          setJogadoresTurma([]);
          setNovoJogadorId("");
          setState("ready");
          return;
        }

        if (!turmaIdNum) {
          setErrorMsg("ID de turma inválido.");
          setState("error");
          return;
        }

        await carregarTudo(turmaIdNum);
        if (!alive) return;
        setState("ready");
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErrorMsg("Falha ao carregar dados da turma. Veja o console.");
        setState("error");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [ehNova, turmaIdNum]);

  async function handleSalvarTurma() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      alert("Informe o nome da turma.");
      return;
    }

    setSalvandoTurma(true);
    setErrorMsg(null);

    try {
      if (ehNova) {
        const criada = await criarTurma({ nome: nomeTrim });
        // Depois de criar, navega para a rota da turma criada
        navigate(`/turmas/${criada.id}`, { replace: true });
        return;
      }

      if (!turma) {
        throw new Error("Turma não carregada.");
      }

      const atualizada = await atualizarTurma(turma.id, { nome: nomeTrim });
      setTurma(atualizada);
      setNome(atualizada.nome);
      alert("Turma salva!");
    } catch (e) {
      console.error(e);
      setErrorMsg("Erro ao salvar turma.");
    } finally {
      setSalvandoTurma(false);
    }
  }

  async function handleAdicionarJogador() {
    if (!turma) {
      alert("Salve a turma antes de adicionar jogadores.");
      return;
    }
    if (!novoJogadorId) return;

    setVinculando(true);
    setErrorMsg(null);

    try {
      await adicionarJogadorNaTurma(turma.id, Number(novoJogadorId));
      setNovoJogadorId("");
      await carregarApenasListas(turma.id);
    } catch (e) {
      console.error(e);
      setErrorMsg("Erro ao adicionar jogador na turma.");
    } finally {
      setVinculando(false);
    }
  }

  async function handleRemoverJogador(jogadorId: number) {
    if (!turma) return;

    setRemovendoId(jogadorId);
    setErrorMsg(null);

    try {
      await removerJogadorDaTurma(turma.id, jogadorId);
      await carregarApenasListas(turma.id);
    } catch (e) {
      console.error(e);
      setErrorMsg("Erro ao remover jogador da turma.");
    } finally {
      setRemovendoId(null);
    }
  }

  if (state === "loading") {
    return (
      <main className="container py-3">
        <button
          className="btn btn-link p-0 mb-3"
          onClick={() => navigate("/turmas")}
        >
          ← Voltar
        </button>
        <p>Carregando...</p>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="container py-3">
        <button
          className="btn btn-link p-0 mb-3"
          onClick={() => navigate("/turmas")}
        >
          ← Voltar
        </button>
        <div className="alert alert-danger" role="alert">
          {errorMsg ?? "Erro inesperado."}
        </div>
      </main>
    );
  }

  return (
    <main className="container py-3">
      <button
        className="btn btn-link p-0 mb-3"
        onClick={() => navigate("/turmas")}
      >
        ← Voltar
      </button>

      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h1 className="h4 mb-1">{ehNova ? "Nova turma" : turma?.nome}</h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            {ehNova
              ? "Crie a turma e depois vincule jogadores."
              : "Gerencie os jogadores vinculados à turma."}
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-success"
            disabled={salvandoTurma}
            onClick={handleSalvarTurma}
          >
            {salvandoTurma ? "Salvando..." : ehNova ? "Criar turma" : "Salvar"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-warning mt-3" role="alert">
          {errorMsg}
        </div>
      )}

      <section className="card mt-3">
        <div className="card-body">
          <label className="form-label">Nome da turma</label>
          <input
            className="form-control"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Adulto"
          />

          <div className="text-muted mt-2" style={{ fontSize: 12 }}>
            Dica: depois vamos evoluir aqui para “recorrência / horários”, mas
            primeiro vamos estabilizar CRUD + vínculo de jogadores.
          </div>
        </div>
      </section>

      <section className="card mt-3">
        <div className="card-body">
          <h2 className="h6 mb-3">Adicionar jogador</h2>

          <div className="d-flex gap-2 flex-wrap">
            <select
              className="form-select"
              value={novoJogadorId}
              onChange={(e) => {
                const v = e.target.value;
                setNovoJogadorId(v ? Number(v) : "");
              }}
              disabled={!turma && !ehNova ? true : false}
            >
              <option value="">Selecione</option>
              {jogadoresDisponiveis.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nome}
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary"
              disabled={!novoJogadorId || vinculando || !turma}
              onClick={handleAdicionarJogador}
              title={!turma ? "Salve a turma antes" : ""}
            >
              {vinculando ? "Adicionando..." : "Adicionar"}
            </button>
          </div>

          {!turma && (
            <div className="text-muted mt-2" style={{ fontSize: 12 }}>
              Salve a turma primeiro para liberar o vínculo de jogadores.
            </div>
          )}
        </div>
      </section>

      <section className="card mt-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="h6 mb-0">Jogadores da turma</h2>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {jogadoresTurma.length} vinculados
            </span>
          </div>

          <hr />

          {jogadoresTurma.length === 0 ? (
            <p className="text-muted mb-0">Nenhum jogador vinculado.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th style={{ width: 160 }} className="text-end">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jogadoresTurma.map((j) => (
                    <tr key={j.jogador_id}>
                      <td>{j.nome}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-link btn-sm text-danger"
                          disabled={removendoId === j.jogador_id}
                          onClick={() => handleRemoverJogador(j.jogador_id)}
                        >
                          {removendoId === j.jogador_id
                            ? "Removendo..."
                            : "Remover"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
