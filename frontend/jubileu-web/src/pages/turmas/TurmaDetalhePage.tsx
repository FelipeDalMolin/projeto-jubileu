import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  obterTurma,
  salvarTurma,
} from "../../services/turmasService";
import type {
  Turma,
  ParticipanteTurma,
  PapelParticipanteTurma,
} from "../../types/turma";

type RouteParams = {
  turmaId: string;
};

export default function TurmaDetalhePage() {
  const { turmaId } = useParams<RouteParams>();
  const navigate = useNavigate();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // campos básicos
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [participantes, setParticipantes] = useState<ParticipanteTurma[]>([]);

  const ehNova = turmaId === "nova";

  useEffect(() => {
    if (ehNova) {
      setTurma(null);
      setNome("");
      setCategoria("");
      setParticipantes([]);
      setLoading(false);
      return;
    }

    if (!turmaId) return;

    const idNum = Number(turmaId);
    if (Number.isNaN(idNum)) {
      setLoading(false);
      return;
    }

    obterTurma(idNum).then((t) => {
      setTurma(t);
      if (t) {
        setNome(t.nome);
        setCategoria(t.categoria ?? "");
        setParticipantes(t.participantes ?? []);
      }
      setLoading(false);
    });
  }, [turmaId, ehNova]);

  const handleChangeParticipanteCampo = (
    idx: number,
    campo: keyof ParticipanteTurma,
    valor: any
  ) => {
    setParticipantes((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              [campo]: valor,
            }
          : p
      )
    );
  };

  const handleToggleAtivo = (idx: number) => {
    setParticipantes((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              ativo: !p.ativo,
            }
          : p
      )
    );
  };

  const handleTogglePodeJogar = (idx: number) => {
    setParticipantes((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              podeJogar: !p.podeJogar,
            }
          : p
      )
    );
  };

  const handleChangePapel = (
    idx: number,
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    const papel = e.target.value as PapelParticipanteTurma;
    handleChangeParticipanteCampo(idx, "papel", papel);
  };

  const handleAdicionarParticipante = () => {
    const novoId =
      participantes.length === 0
        ? 1
        : Math.max(...participantes.map((p) => p.id)) + 1;

    const novo: ParticipanteTurma = {
      id: novoId,
      jogadorId: novoId, // por enquanto usamos o mesmo id
      nome: "",
      papel: "aluno",
      ativo: true,
      podeJogar: true,
    };

    setParticipantes((prev) => [...prev, novo]);
  };

  const handleRemoverParticipante = (idx: number) => {
    setParticipantes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      alert("Informe o nome da turma.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        id: turma?.id,
        nome: nome.trim(),
        categoria: categoria.trim() || undefined,
        participantes,
      };

      const salvo = await salvarTurma(payload);
      setTurma(salvo);
      alert("Turma salva com sucesso!");
      navigate("/turmas");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar turma (mock). Veja o console.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <main className="container py-3">
        <button
          className="btn btn-link p-0 mb-3"
          onClick={() => navigate("/turmas")}
        >
          ← Voltar
        </button>
        <p>Carregando turma...</p>
      </main>
    );
  }

  return (
    <main className="container py-3">
      <button
        className="btn btn-link p-0 mb-3"
        onClick={() => navigate("/turmas")}
      >
        ← Voltar para turmas
      </button>

      <h1 className="h4 mb-3">
        {ehNova ? "Nova turma" : `Turma: ${turma?.nome ?? nome}`}
      </h1>

      <div className="mb-3">
        <label className="form-label">Nome da turma</label>
        <input
          className="form-control"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Categoria/Faixa etária</label>
        <input
          className="form-control"
          placeholder="Ex.: Adulto, Sub-11..."
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
      </div>

      <section className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 mb-0">Participantes da turma</h2>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={handleAdicionarParticipante}
          >
            + Adicionar participante
          </button>
        </div>

        <p className="text-muted" style={{ fontSize: 12 }}>
          Use <strong>Ativo</strong> para marcar ex-alunos/professores
          (mantidos para histórico). Use <strong>Pode jogar</strong> para
          indicar quem entra na lista de jogadores da Aula.
        </p>

        {participantes.length === 0 ? (
          <p className="text-muted">Nenhum participante cadastrado.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Papel</th>
                  <th>Ativo</th>
                  <th>Pode jogar</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p, idx) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={p.nome}
                        onChange={(e) =>
                          handleChangeParticipanteCampo(
                            idx,
                            "nome",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={p.papel}
                        onChange={(e) => handleChangePapel(idx, e)}
                      >
                        <option value="aluno">Aluno</option>
                        <option value="professor">Professor</option>
                      </select>
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={p.ativo}
                        onChange={() => handleToggleAtivo(idx)}
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={p.podeJogar}
                        onChange={() => handleTogglePodeJogar(idx)}
                      />
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-danger p-0"
                        onClick={() => handleRemoverParticipante(idx)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="d-flex justify-content-end">
        <button
          type="button"
          className="btn btn-success"
          disabled={salvando}
          onClick={handleSalvar}
        >
          {salvando ? "Salvando..." : "Salvar turma (mock)"}
        </button>
      </div>
    </main>
  );
}
