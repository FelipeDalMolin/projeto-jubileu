import { useEffect, useMemo, useState } from "react";

import { PageHeader, PageShell } from "../components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/feedback";
import {
  ResponsiveTable,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../components/ui/responsive-table";
import { StatusBadge } from "../components/ui/status-badge";
import { useAuthSession } from "../hooks/useAuthSession";
import { obterUsuarioMe, type UsuarioMeResponse } from "../services/usuariosService";

function formatEventoTipo(tipo: string) {
  if (tipo === "JOGO_LIVRE") return "Jogo livre";
  if (tipo === "OUTRO") return "Outro";
  return "Aula";
}

export default function UsuarioPerfil() {
  const { user, getRequestAuth } = useAuthSession();
  const [usuarioMe, setUsuarioMe] = useState<UsuarioMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

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
        const usuarioData = await obterUsuarioMe(auth);
        if (!canceled) {
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
  }, [getRequestAuth, user?.jogadorId, user?.role, user?.userId]);

  const eventos = useMemo(() => usuarioMe?.eventos ?? [], [usuarioMe?.eventos]);
  const resumo = useMemo(() => {
    const encerrados = eventos.filter((evento) => evento.status === "ENCERRADO").length;
    const emAndamento = eventos.filter((evento) => evento.status === "EM_ANDAMENTO").length;
    return { total: eventos.length, encerrados, emAndamento };
  }, [eventos]);

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
            COOKIE HTTPONLY
          </span>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Papel autorizado</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{user.role}</p>
              <p className="text-xs text-slate-500">Definido e validado pelo backend.</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Jogador vinculado</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {usuarioMe?.jogador?.nome ?? "Nenhum jogador vinculado"}
              </p>
              <p className="text-xs text-slate-500">O vinculo e administrado por um treinador ou administrador.</p>
            </div>
          </div>
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
