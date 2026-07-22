import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useAuth } from "../../context/AuthContext";

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
  const { user } = useAuth();
  const canManage = Boolean(user && user.role !== "user");

  const turmaIdNum = useMemo(() => {
    if (!turmaId || ehNova) return null;
    const n = Number(turmaId);
    return Number.isFinite(n) ? n : null;
  }, [turmaId, ehNova]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [turma, setTurma] = useState<Turma | null>(null);
  const [nome, setNome] = useState("");
  const [savingTurma, setSavingTurma] = useState(false);

  const [jogadoresTurma, setJogadoresTurma] = useState<TurmaJogador[]>([]);
  const [todosJogadores, setTodosJogadores] = useState<JogadorDTO[]>([]);
  const [novoJogadorId, setNovoJogadorId] = useState<number | "">("");
  const [savingJogador, setSavingJogador] = useState(false);
  const [removingJogadorId, setRemovingJogadorId] = useState<number | null>(null);

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
          setErro("Turma invalida.");
          return;
        }

        const turmaAtual = await obterTurma(turmaIdNum);
        if (!alive) return;

        setTurma(turmaAtual);
        setNome(turmaAtual.nome);

        await recarregarJogadoresTurma(turmaAtual.id);
      } catch (e: unknown) {
        console.error(e);
        setErro(errorMessage(e, "Falha ao carregar dados da turma."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    void carregar();
    return () => {
      alive = false;
    };
  }, [ehNova, turmaIdNum]);

  const jogadoresDisponiveis = useMemo(() => {
    const setIds = new Set(jogadoresTurma.map((jt) => jt.id));
    return todosJogadores.filter((j) => !setIds.has(j.id)).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [todosJogadores, jogadoresTurma]);

  async function handleSalvarTurma() {
    setErro(null);
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      setErro("Informe o nome da turma.");
      return;
    }

    setSavingTurma(true);
    try {
      if (ehNova) {
        const criada = await criarTurma({ nome: nomeTrim });
        navigate(`/turmas/${criada.id}`, { replace: true });
        return;
      }

      if (!turma) return;
      const atualizada = await atualizarTurma(turma.id, { nome: nomeTrim });
      setTurma(atualizada);
    } catch (e: unknown) {
      console.error(e);
      setErro(errorMessage(e, "Erro ao salvar turma."));
    } finally {
      setSavingTurma(false);
    }
  }

  async function handleAdicionarJogador() {
    if (!turma || !novoJogadorId) return;
    setErro(null);
    setSavingJogador(true);
    try {
      await adicionarJogadorNaTurma(turma.id, Number(novoJogadorId));
      await recarregarJogadoresTurma(turma.id);
      setNovoJogadorId("");
    } catch (e: unknown) {
      console.error(e);
      setErro(errorMessage(e, "Erro ao adicionar jogador."));
    } finally {
      setSavingJogador(false);
    }
  }

  async function handleRemoverJogador(jogadorId: number) {
    if (!turma) return;
    setErro(null);
    setRemovingJogadorId(jogadorId);
    try {
      await removerJogadorDaTurma(turma.id, jogadorId);
      await recarregarJogadoresTurma(turma.id);
    } catch (e: unknown) {
      console.error(e);
      setErro(errorMessage(e, "Erro ao remover jogador."));
    } finally {
      setRemovingJogadorId(null);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <LoadingState label="Carregando turma..." />
      </PageShell>
    );
  }

  if (ehNova && !canManage) {
    return (
      <PageShell>
        <ErrorState title="Acao nao permitida" message="Seu perfil possui acesso somente para consulta." />
        <Button type="button" variant="outline" onClick={() => navigate("/turmas")}>Voltar</Button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={ehNova ? "Nova turma" : `Turma: ${turma?.nome ?? ""}`}
        description={ehNova ? "Crie o grupo antes de vincular jogadores." : "Gerencie nome e jogadores vinculados."}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => navigate("/turmas")}>
            Voltar
          </Button>
        }
      />

      {erro ? <ErrorState message={erro} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados da turma</CardTitle>
          <CardDescription>Nome usado em eventos do tipo AULA e filtros operacionais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={savingTurma || !canManage} />
          {canManage ? <Toolbar>
            <Button type="button" variant="outline" onClick={() => navigate("/turmas")} disabled={savingTurma}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSalvarTurma} disabled={savingTurma}>
              {savingTurma ? "Salvando..." : ehNova ? "Criar turma" : "Salvar alteracoes"}
            </Button>
          </Toolbar> : null}
        </CardContent>
      </Card>

      {!ehNova && turma ? (
        <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          {canManage ? <Card>
            <CardHeader>
              <CardTitle>Adicionar jogador</CardTitle>
              <CardDescription>Somente jogadores ainda nao vinculados aparecem na lista.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SelectField
                label="Jogador"
                value={novoJogadorId}
                onChange={(e) => {
                  const value = e.target.value;
                  setNovoJogadorId(value ? Number(value) : "");
                }}
                disabled={savingJogador}
              >
                <option value="">Selecione</option>
                {jogadoresDisponiveis.map((jogador) => (
                  <option key={jogador.id} value={jogador.id}>
                    {jogador.nome}
                  </option>
                ))}
              </SelectField>
              <Button type="button" size="sm" disabled={!novoJogadorId || savingJogador} onClick={handleAdicionarJogador}>
                {savingJogador ? "Adicionando..." : "Adicionar"}
              </Button>
            </CardContent>
          </Card> : null}

          <Card>
            <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Jogadores da turma</CardTitle>
                <CardDescription>{jogadoresTurma.length} vinculado(s).</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {jogadoresTurma.length === 0 ? (
                <EmptyState title="Nenhum jogador vinculado" description="Use o seletor ao lado para montar a turma." />
              ) : (
                <ResponsiveTable>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Nome</TableHeaderCell>
                      {canManage ? <TableHeaderCell className="w-32 text-right">Acoes</TableHeaderCell> : null}
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {jogadoresTurma.map((jogador) => (
                      <TableRow key={jogador.id}>
                        <TableCell className="font-medium text-slate-950">{jogador.nome}</TableCell>
                        {canManage ? <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="danger"
                            size="xs"
                            onClick={() => handleRemoverJogador(jogador.id)}
                            disabled={removingJogadorId === jogador.id}
                          >
                            {removingJogadorId === jogador.id ? "Removendo..." : "Remover"}
                          </Button>
                        </TableCell> : null}
                      </TableRow>
                    ))}
                  </tbody>
                </ResponsiveTable>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {ehNova ? (
        <EmptyState title="Jogadores entram depois" description="Crie a turma primeiro. Depois voce vincula jogadores no detalhe." />
      ) : null}
    </PageShell>
  );
}
