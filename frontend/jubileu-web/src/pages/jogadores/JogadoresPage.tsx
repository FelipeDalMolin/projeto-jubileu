import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, PageShell, Toolbar } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/feedback";
import { Field, SelectField } from "../../components/ui/form";
import {
  ResponsiveTable,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/responsive-table";
import { StatusBadge } from "../../components/ui/status-badge";
import { useAuth } from "../../context/AuthContext";
import {
  listarJogadores,
  criarJogador,
  atualizarJogador,
  deletarJogador,
  type JogadorDTO,
  type JogadorStatus,
} from "../../services/jogadoresService";

type FormMode = "create" | "edit";

type FormState = {
  nome: string;
  apelido: string;
  status: JogadorStatus;
};

const STATUS_OPTIONS: Array<{ value: JogadorStatus; label: string }> = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "lesionado", label: "Lesionado" },
  { value: "afastado", label: "Afastado" },
];

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function JogadoresPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = Boolean(user && user.role !== "user");

  const [jogadores, setJogadores] = useState<JogadorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [formErro, setFormErro] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [modo, setModo] = useState<FormMode>("create");
  const [jogadorEditando, setJogadorEditando] = useState<JogadorDTO | null>(null);
  const [form, setForm] = useState<FormState>({
    nome: "",
    apelido: "",
    status: "ativo",
  });

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        const dados = await listarJogadores();
        setJogadores(dados);
      } catch (err: unknown) {
        console.error(err);
        setErro(errorMessage(err, "Erro ao carregar jogadores."));
      } finally {
        setLoading(false);
      }
    };

    void carregar();
  }, []);

  const resumo = useMemo(() => {
    const ativos = jogadores.filter((jogador) => jogador.status === "ativo").length;
    return { total: jogadores.length, ativos };
  }, [jogadores]);

  const resetForm = () => {
    setModo("create");
    setJogadorEditando(null);
    setFormErro(null);
    setForm({
      nome: "",
      apelido: "",
      status: "ativo",
    });
  };

  const handleChangeInput = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormErro(null);
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setFormErro("Informe o nome do jogador.");
      return;
    }

    try {
      setSalvando(true);
      setErro(null);
      setFormErro(null);

      if (modo === "create") {
        const novo = await criarJogador({
          nome: form.nome.trim(),
          apelido: form.apelido.trim() || undefined,
          status: form.status,
        });
        setJogadores((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
        resetForm();
      } else if (modo === "edit" && jogadorEditando) {
        const atualizado = await atualizarJogador(jogadorEditando.id, {
          nome: form.nome.trim(),
          apelido: form.apelido.trim() || undefined,
          status: form.status,
        });
        setJogadores((prev) =>
          prev.map((j) => (j.id === atualizado.id ? atualizado : j)).sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        resetForm();
      }
    } catch (err: unknown) {
      console.error(err);
      setErro(errorMessage(err, "Erro ao salvar jogador."));
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (jogador: JogadorDTO) => {
    setModo("edit");
    setJogadorEditando(jogador);
    setFormErro(null);
    setForm({
      nome: jogador.nome,
      apelido: jogador.apelido ?? "",
      status: jogador.status ?? "ativo",
    });
  };

  const handleExcluir = async (jogador: JogadorDTO) => {
    const ok = window.confirm(`Tem certeza que deseja remover o jogador "${jogador.nome}"?`);
    if (!ok) return;

    try {
      setDeletingId(jogador.id);
      setErro(null);
      await deletarJogador(jogador.id);
      setJogadores((prev) => prev.filter((x) => x.id !== jogador.id));
      if (jogadorEditando?.id === jogador.id) {
        resetForm();
      }
    } catch (err: unknown) {
      console.error(err);
      setErro(errorMessage(err, "Erro ao excluir jogador."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell data-testid="page-jogadores">
      <PageHeader
        title="Jogadores"
        description="Cadastro central de jogadores do clube."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            Voltar para dashboard
          </Button>
        }
      />

      {erro ? <ErrorState message={erro} /> : null}

      <section className={canManage ? "grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]" : "grid gap-4"}>
        {canManage ? <Card>
          <CardHeader>
            <CardTitle>{modo === "create" ? "Novo jogador" : "Editar jogador"}</CardTitle>
            <CardDescription>
              {modo === "create" ? "Cadastre um atleta para usar em turmas e eventos." : "Atualize o cadastro selecionado."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form data-testid="form-jogador" onSubmit={handleSubmit} className="space-y-3">
              <Field
                label="Nome *"
                value={form.nome}
                onChange={(e) => handleChangeInput("nome", e.target.value)}
                disabled={salvando}
              />

              <Field
                label="Apelido"
                value={form.apelido}
                onChange={(e) => handleChangeInput("apelido", e.target.value)}
                disabled={salvando}
              />

              <SelectField
                label="Status"
                value={form.status}
                onChange={(e) => handleChangeInput("status", e.target.value as JogadorStatus)}
                disabled={salvando}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>

              {formErro ? <ErrorState title="Revise o formulario" message={formErro} /> : null}

              <Toolbar>
                <Button data-testid="button-salvar-jogador" type="submit" size="sm" disabled={salvando}>
                  {salvando ? "Salvando..." : modo === "create" ? "Adicionar" : "Salvar alteracoes"}
                </Button>
                {modo === "edit" ? (
                  <Button type="button" variant="outline" size="sm" onClick={resetForm} disabled={salvando}>
                    Cancelar edicao
                  </Button>
                ) : null}
              </Toolbar>
            </form>
          </CardContent>
        </Card> : null}

        <Card>
          <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Lista de jogadores</CardTitle>
              <CardDescription>
                {resumo.total} cadastrado(s), {resumo.ativos} ativo(s).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingState label="Carregando jogadores..." />
            ) : jogadores.length === 0 ? (
              <EmptyState title="Nenhum jogador cadastrado" description="Use o formulario ao lado para adicionar o primeiro jogador." />
            ) : (
              <ResponsiveTable>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Nome</TableHeaderCell>
                    <TableHeaderCell>Apelido</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    {canManage ? <TableHeaderCell className="w-48 text-right">Acoes</TableHeaderCell> : null}
                  </TableRow>
                </TableHead>
                <tbody>
                  {jogadores.map((jogador) => (
                    <TableRow key={jogador.id}>
                      <TableCell className="font-medium text-slate-950">{jogador.nome}</TableCell>
                      <TableCell>{jogador.apelido || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge value={jogador.status} />
                      </TableCell>
                      {canManage ? <TableCell>
                        <Toolbar className="justify-end">
                          <Button type="button" variant="outline" size="xs" onClick={() => handleEditar(jogador)}>
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="xs"
                            onClick={() => handleExcluir(jogador)}
                            disabled={deletingId === jogador.id}
                          >
                            {deletingId === jogador.id ? "Excluindo..." : "Excluir"}
                          </Button>
                        </Toolbar>
                      </TableCell> : null}
                    </TableRow>
                  ))}
                </tbody>
              </ResponsiveTable>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
