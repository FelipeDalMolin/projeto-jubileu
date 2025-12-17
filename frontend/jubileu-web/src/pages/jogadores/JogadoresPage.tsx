// src/pages/jogadores/JogadoresPage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarJogadores,
  criarJogador,
  atualizarJogador,
  deletarJogador,
  type JogadorDTO,
} from "../../services/jogadoresService";

type FormMode = "create" | "edit";

type FormState = {
  nome: string;
  apelido: string;
  status: string;
};

export default function JogadoresPage() {
  const navigate = useNavigate();

  const [jogadores, setJogadores] = useState<JogadorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modo, setModo] = useState<FormMode>("create");
  const [jogadorEditando, setJogadorEditando] = useState<JogadorDTO | null>(
    null,
  );
  const [form, setForm] = useState<FormState>({
    nome: "",
    apelido: "",
    status: "ativo",
  });

  const [salvando, setSalvando] = useState(false);

  // --------- Carregar lista ---------

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        const dados = await listarJogadores();
        setJogadores(dados);
      } catch (err: any) {
        console.error(err);
        setErro(err?.message ?? "Erro ao carregar jogadores.");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  // --------- Helpers de formulário ---------

  const resetForm = () => {
    setModo("create");
    setJogadorEditando(null);
    setForm({
      nome: "",
      apelido: "",
      status: "ativo",
    });
  };

  const handleChangeInput = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      alert("Informe o nome do jogador.");
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      if (modo === "create") {
        const novo = await criarJogador({
          nome: form.nome.trim(),
          apelido: form.apelido.trim() || undefined,
          status: form.status,
        });
        setJogadores((prev) =>
          [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        resetForm();
      } else if (modo === "edit" && jogadorEditando) {
        const atualizado = await atualizarJogador(jogadorEditando.id, {
          nome: form.nome.trim(),
          apelido: form.apelido.trim() || undefined,
          status: form.status,
        });
        setJogadores((prev) =>
          prev
            .map((j) => (j.id === atualizado.id ? atualizado : j))
            .sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        resetForm();
      }
    } catch (err: any) {
      console.error(err);
      setErro(err?.message ?? "Erro ao salvar jogador.");
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (j: JogadorDTO) => {
    setModo("edit");
    setJogadorEditando(j);
    setForm({
      nome: j.nome,
      apelido: j.apelido ?? "",
      status: j.status ?? "ativo",
    });
  };

  const handleExcluir = async (j: JogadorDTO) => {
    const ok = window.confirm(
      `Tem certeza que deseja remover o jogador "${j.nome}"?`,
    );
    if (!ok) return;

    try {
      await deletarJogador(j.id);
      setJogadores((prev) => prev.filter((x) => x.id !== j.id));
      if (jogadorEditando?.id === j.id) {
        resetForm();
      }
    } catch (err: any) {
      console.error(err);
      setErro(err?.message ?? "Erro ao excluir jogador.");
    }
  };

  // --------- Render ---------

  return (
    <main className="container py-3">
      <button className="btn btn-link p-0 mb-3" onClick={() => navigate("/")}>
        ← Voltar para o dashboard
      </button>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 mb-0">Jogadores</h1>
          <p className="text-muted mb-0">
            Cadastro central de jogadores do clube.
          </p>
        </div>
      </div>

      {erro && <div className="alert alert-danger py-2">{erro}</div>}

      <div className="row">
        {/* Formulário */}
        <section className="col-12 col-lg-4 mb-3">
          <div className="card">
            <div className="card-body">
              <h2 className="h6 mb-3">
                {modo === "create" ? "Novo jogador" : "Editar jogador"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <label className="form-label form-label-sm">Nome *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={form.nome}
                    onChange={(e) =>
                      handleChangeInput("nome", e.target.value)
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label form-label-sm">Apelido</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={form.apelido}
                    onChange={(e) =>
                      handleChangeInput("apelido", e.target.value)
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label form-label-sm">Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.status}
                    onChange={(e) =>
                      handleChangeInput("status", e.target.value)
                    }
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={salvando}
                  >
                    {salvando
                      ? "Salvando..."
                      : modo === "create"
                      ? "Adicionar"
                      : "Salvar alterações"}
                  </button>
                  {modo === "edit" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={resetForm}
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Lista */}
        <section className="col-12 col-lg-8 mb-3">
          <div className="card">
            <div className="card-body">
              <h2 className="h6 mb-3">Lista de jogadores</h2>

              {loading ? (
                <p className="text-muted mb-0">Carregando jogadores...</p>
              ) : jogadores.length === 0 ? (
                <p className="text-muted mb-0">
                  Nenhum jogador cadastrado ainda.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Apelido</th>
                        <th>Status</th>
                        <th style={{ width: 140 }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jogadores.map((j) => (
                        <tr key={j.id}>
                          <td>{j.nome}</td>
                          <td>{j.apelido}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {j.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEditar(j)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleExcluir(j)}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
