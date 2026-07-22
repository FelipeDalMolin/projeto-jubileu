import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PageShell, Toolbar } from "../../components/layout/PageShell";
import { buttonClasses } from "../../components/ui/button-classes";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/feedback";
import { Field } from "../../components/ui/form";
import {
  ResponsiveTable,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../components/ui/responsive-table";
import { criarTurma, listarTurmas, type Turma } from "../../services/turmasService";
import { useAuth } from "../../context/AuthContext";

export default function TurmasPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && user.role !== "user");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const turmasOrdenadas = useMemo(() => [...turmas].sort((a, b) => a.nome.localeCompare(b.nome)), [turmas]);

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
    void carregar();
  }, []);

  async function handleCriarTurma(e: FormEvent) {
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
    <PageShell data-testid="page-turmas">
      <PageHeader
        title="Turmas"
        description="Grupos de jogadores usados para eventos do tipo AULA."
        actions={canManage ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setErrorMsg(null);
              setShowCreate((value) => !value);
            }}
          >
            + Nova turma
          </Button>
        ) : undefined}
      />

      {canManage && showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Nova turma</CardTitle>
            <CardDescription>Depois de criar a turma, vincule os jogadores no detalhe.</CardDescription>
          </CardHeader>
          <CardContent>
            <form data-testid="form-turma" onSubmit={handleCriarTurma} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Field
                label="Nome da turma"
                id="turma-nome"
                name="turma-nome"
                placeholder="Ex: Sub-11, Adulto, Feminino..."
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                autoComplete="off"
                disabled={saving}
              />

              <Toolbar className="md:pb-0">
                <Button data-testid="button-salvar-turma" type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false);
                    setNome("");
                    setErrorMsg(null);
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </Toolbar>
            </form>
            {errorMsg ? <ErrorState message={errorMsg} className="mt-3" /> : null}
          </CardContent>
        </Card>
      ) : errorMsg ? (
        <ErrorState message={errorMsg} />
      ) : null}

      <Card>
        <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Lista de turmas</CardTitle>
            <CardDescription>{turmasOrdenadas.length} turma(s) cadastrada(s).</CardDescription>
          </div>
          {!loading ? (
            <Button type="button" variant="outline" size="sm" onClick={carregar}>
              Recarregar
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Carregando turmas..." />
          ) : turmasOrdenadas.length === 0 ? (
            <EmptyState title="Nenhuma turma cadastrada" description="Crie uma turma para organizar eventos do tipo AULA." />
          ) : (
            <ResponsiveTable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell className="w-32 text-right">Acoes</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {turmasOrdenadas.map((turma) => (
                  <TableRow key={turma.id}>
                    <TableCell className="font-medium text-slate-950">{turma.nome}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/turmas/${turma.id}`} className={buttonClasses({ variant: "outline", size: "xs" })}>
                        Abrir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
