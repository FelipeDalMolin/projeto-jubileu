import { useEffect, useMemo, useState } from "react";

import { useAuthSession } from "../hooks/useAuthSession";
import { listarJogadores, type JogadorDTO } from "../services/jogadoresService";
import type { UserRole } from "../services/authService";
import { obterUsuarioMe, type UsuarioMeResponse } from "../services/usuariosService";

const ROLES: UserRole[] = ["user", "auxiliar", "treinador", "admin"];

function formatEventoStatus(status: string) {
  if (status === "EM_ANDAMENTO") return "Em andamento";
  if (status === "ENCERRADO") return "Encerrado";
  if (status === "CANCELADO") return "Cancelado";
  return "Planejado";
}

export default function UsuarioPerfil() {
  const { user, setRole, setJogadorId, getRequestAuth } = useAuthSession();
  const [jogadores, setJogadores] = useState<JogadorDTO[]>([]);
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
        const [jogadoresData, usuarioData] = await Promise.all([
          listarJogadores(),
          obterUsuarioMe(auth),
        ]);
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

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="mb-2 text-2xl font-semibold">Usuario</h1>
        <p className="text-sm text-muted-foreground">Faca login para ver perfil e eventos participados.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Usuario</h1>
          <p className="text-sm text-muted-foreground">
            Perfil persistido, identidade operacional e historico de eventos.
          </p>
        </div>
        {loading ? <span className="text-sm text-muted-foreground">Carregando...</span> : null}
      </div>

      {erro ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {erro}
        </div>
      ) : null}

      <section className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs uppercase text-muted-foreground">Perfil</div>
          <div className="mt-2 text-lg font-semibold">
            {usuarioMe?.usuario.display_name ?? user.displayName}
          </div>
          <div className="text-sm text-muted-foreground">
            {usuarioMe?.usuario.email ?? user.email ?? "Sem e-mail cadastrado"}
          </div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs uppercase text-muted-foreground">Jogador vinculado</div>
          <div className="mt-2 text-lg font-semibold">
            {usuarioMe?.jogador?.nome ?? "Nenhum jogador"}
          </div>
          <div className="text-sm text-muted-foreground">
            {usuarioMe?.jogador ? `ID ${usuarioMe.jogador.id}` : "Acoes self ficam indisponiveis"}
          </div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs uppercase text-muted-foreground">Eventos</div>
          <div className="mt-2 text-lg font-semibold">{resumo.total}</div>
          <div className="text-sm text-muted-foreground">
            {resumo.encerrados} encerrados, {resumo.emAndamento} em andamento
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-md border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Sessao operacional</h2>
            <p className="text-sm text-muted-foreground">Contexto usado nas acoes administrativas e self-service.</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
            {user.authMode.toUpperCase()} {user.accessToken ? "com token" : "sem token"}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Role operacional
            <select
              className="form-select mt-1"
              value={user.role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            Jogador operacional
            <select
              className="form-select mt-1"
              value={user.jogadorId ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                setJogadorId(raw ? Number(raw) : null);
              }}
            >
              <option value="">Nenhum</option>
              {jogadores.map((jogador) => (
                <option key={jogador.id} value={jogador.id}>
                  {jogador.nome} ({jogador.id})
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Eventos participados</h2>
          <span className="text-sm text-muted-foreground">{eventos.length} registro(s)</span>
        </div>

        {eventos.length === 0 ? (
          <p className="mb-0 text-sm text-muted-foreground">Nenhum evento encontrado para este usuario.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm mb-0 align-middle">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Evento</th>
                  <th>Turma</th>
                  <th>Status</th>
                  <th>Participacao</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.evento_id}>
                    <td>{evento.data_iso}</td>
                    <td>
                      <div className="font-medium">#{evento.evento_id} {evento.tipo}</div>
                      <div className="text-xs text-muted-foreground">
                        {evento.horario_inicio} - {evento.horario_fim}
                      </div>
                    </td>
                    <td>{evento.turma_nome}</td>
                    <td>{formatEventoStatus(evento.status)}</td>
                    <td>{evento.participante_status ?? "Snapshot da turma"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
