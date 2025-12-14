import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  obterTurma,
  atualizarTurma,
  listarJogadoresDaTurma,
  adicionarJogadorNaTurma,
  removerJogadorDaTurma,
} from "../../services/turmasService";
import { listarJogadores, type JogadorDTO } from "../../services/jogadoresService";

export default function TurmaDetalhePage() {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();

  const [turma, setTurma] = useState<any>(null);
  const [jogadoresTurma, setJogadoresTurma] = useState<any[]>([]);
  const [todosJogadores, setTodosJogadores] = useState<JogadorDTO[]>([]);
  const [novoJogadorId, setNovoJogadorId] = useState<number | "">("");

  useEffect(() => {
    if (!turmaId) return;

    obterTurma(Number(turmaId)).then(setTurma);
    listarJogadoresDaTurma(Number(turmaId)).then(setJogadoresTurma);
    listarJogadores().then(setTodosJogadores);
  }, [turmaId]);

  if (!turma) return <p className="container py-3">Carregando...</p>;

  const jogadoresDisponiveis = todosJogadores.filter(
    (j) => !jogadoresTurma.some((jt) => jt.jogador_id === j.id)
  );

  return (
    <main className="container py-3">
      <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/turmas")}>
        ← Voltar
      </button>

      <h1 className="h4 mb-3">{turma.nome}</h1>

      <section className="mb-4">
        <h2 className="h6">Adicionar jogador</h2>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            value={novoJogadorId}
            onChange={(e) => setNovoJogadorId(Number(e.target.value))}
          >
            <option value="">Selecione</option>
            {jogadoresDisponiveis.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nome}
              </option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-primary"
            disabled={!novoJogadorId}
            onClick={async () => {
              await adicionarJogadorNaTurma(turma.id, Number(novoJogadorId));
              setJogadoresTurma(await listarJogadoresDaTurma(turma.id));
              setNovoJogadorId("");
            }}
          >
            Adicionar
          </button>
        </div>
      </section>

      <section>
        <h2 className="h6">Jogadores da turma</h2>
        {jogadoresTurma.length === 0 ? (
          <p className="text-muted">Nenhum jogador vinculado.</p>
        ) : (
          <table className="table table-sm">
            <tbody>
              {jogadoresTurma.map((j) => (
                <tr key={j.jogador_id}>
                  <td>{j.nome}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-link btn-sm text-danger"
                      onClick={async () => {
                        await removerJogadorDaTurma(turma.id, j.jogador_id);
                        setJogadoresTurma(await listarJogadoresDaTurma(turma.id));
                      }}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
