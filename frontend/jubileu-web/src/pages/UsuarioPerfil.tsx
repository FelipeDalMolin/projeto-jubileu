import { useEffect, useMemo, useState } from "react";

import { PageHeader, PageShell } from "../components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/feedback";
import { SelectField } from "../components/ui/form";
import {
  ResponsiveTable,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../components/ui/responsive-table";
import { StatusBadge } from "../components/ui/status-badge";
import { useAuthSession } from "../hooks/useAuthSession";
import { listarJogadores, type JogadorDTO } from "../services/jogadoresService";
import type { UserRole } from "../services/authService";
import {
  atualizarUsuarioJogador,
  obterUsuarioMe,
  type UsuarioMeResponse,
} from "../services/usuariosService";

const ROLES: UserRole[] = ["user", "auxiliar", "treinador", "admin"];

function formatEventoTipo(tipo: string) {
  if (tipo === "JOGO_LIVRE") return "Jogo livre";
  if (tipo === "OUTRO") return "Outro";
  return "Aula";
}

export default function UsuarioPerfil() {
  const { user, setRole, setJogadorId, getRequestAuth } = useAuthSession();
  const [jogadores, setJogadores] = useState<JogadorDTO[]>([]);
  const [usuarioMe, setUsuarioMe] = useState<UsuarioMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingJogador, setSavingJogador] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    async function load() {
      const auth = getRequestAuth();
      if (!auth) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErro(null);
      try {
        const [jogadoresData, usuarioData] = await Promise.all([listarJogadores(), obterUsuarioMe(auth)]);
        if (!canceled) {
          setJogadores(jogadoresData);
          setUsuarioMe(usuarioData);
        }
      } catch (err: unknown) {
        if (!canceled) {
          setErro(err instanceof Error ? err.message : "Falha ao carregar usuario");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => {
      canceled = true;
    };
  }, [getRequestAuth, user?.accessToken, user?.jogadorId, user?.role, user?.userId]);

  const eventos = useMemo(() => usuarioMe?.eventos ?? [], [usuarioMe?.eventos]);
  const resumo = useMemo(() => {
    const encerrados = eventos.filter((evento) => evento.status === "ENCERRADO").length;
    const emAndamento = eventos.filter((evento) => evento.status === "EM_ANDAMENTO").length;
    return { total: eventos.length, encerrados, emAndamento };
  }, [eventos]);

  async function handleAlterarJogadorVinculado(raw: string) {
    const auth = getRequestAuth();
    if (!auth) return;

    const jogadorId = raw ? Number(raw) : null;
    setSavingJogador(true);
    setErro(null);
    setMensagem(null);
    try {
      const atualizado = await atualizarUsuarioJogador(auth, jogadorId);
      setUsuarioMe(atualizado);
      setJogadorId(atualizado.usuario.jogador_id ?? null);
      setMensagem("Vinculo de jogador salvo.");
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Falha ao vincular jogador");
    } finally {
      setSavingJogador(false);
    }
  }

  if (!user) {
    return (
      <PageShell>
        <PageHeader title="Usuario" description="Faca login para ver perfil e eventos participados." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Usuario"
        description="Perfil persistido, identidade operacional e historico de eventos."
        actions={loading ? <span className="text-sm text-slate-500">Carregando...</span> : null}
      />

      {erro ? <ErrorState message={erro} /> : null}
      {mensagem ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {mensagem}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Perfil</CardDescription>
            <CardTitle>{usuarioMe?.usuario.display_name ?? user.displayName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">{usuarioMe?.usuario.email ?? user.email ?? "Sem e-mail cadastrado"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Jogador vinculado</CardDescription>
            <CardTitle>{usuarioMe?.jogador?.nome ?? "Nenhum jogador"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {usuarioMe?.jogador ? `ID ${usuarioMe.jogador.id}` : "Acoes self ficam indisponiveis"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Eventos</CardDescription>
            <CardTitle>{resumo.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {resumo.encerrados} encerrados, {resumo.emAndamento} em andamento
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Sessao operacional</CardTitle>
          <CardDescription>Contexto usado nas acoes administrativas e self-service.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <span className="inline-flex w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {user.authMode.toUpperCase()} {user.accessToken ? "com token" : "sem token"}
          </span>

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField label="Role operacional" value={user.role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Jogador vinculado ao usuario"
              value={usuarioMe ? usuarioMe.usuario.jogador_id ?? "" : user.jogadorId ?? ""}
              disabled={savingJogador || loading}
              onChange={(e) => {
                void handleAlterarJogadorVinculado(e.target.value);
              }}
            >
              <option value="">Nenhum</option>
              {jogadores.map((jogador) => (
                <option key={jogador.id} value={jogador.id}>
                  {jogador.nome} ({jogador.id})
                </option>
              ))}
            </SelectField>
          </div>
          {savingJogador ? <p className="text-sm text-slate-500">Salvando jogador vinculado...</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Eventos participados</CardTitle>
            <CardDescription>{eventos.length} registro(s).</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="Carregando eventos..." />
          ) : eventos.length === 0 ? (
            <EmptyState title="Nenhum evento encontrado" description="Eventos aparecem aqui quando o usuario participa ou aparece no snapshot da turma." />
          ) : (
            <ResponsiveTable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Data</TableHeaderCell>
                  <TableHeaderCell>Evento</TableHeaderCell>
                  <TableHeaderCell>Turma</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Participacao</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {eventos.map((evento) => (
                  <TableRow key={evento.evento_id}>
                    <TableCell>{evento.data_iso}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-950">
                        #{evento.evento_id} {formatEventoTipo(evento.tipo)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {evento.horario_inicio} - {evento.horario_fim}
                      </div>
                    </TableCell>
                    <TableCell>{evento.turma_nome ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge value={evento.status} />
                    </TableCell>
                    <TableCell>{evento.participante_status ?? "Snapshot da turma"}</TableCell>
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
