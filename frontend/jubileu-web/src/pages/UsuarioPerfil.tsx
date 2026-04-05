import { useEffect, useState } from "react";

import { useAuthSession } from "../hooks/useAuthSession";
import { listarJogadores, type JogadorDTO } from "../services/jogadoresService";
import type { UserRole } from "../services/authService";

const ROLES: UserRole[] = ["user", "auxiliar", "treinador", "admin"];

export default function UsuarioPerfil() {
  const { user, setRole, setJogadorId } = useAuthSession();
  const [jogadores, setJogadores] = useState<JogadorDTO[]>([]);
  const [loadingJogadores, setLoadingJogadores] = useState(true);
  const [erroJogadores, setErroJogadores] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    async function loadJogadores() {
      setLoadingJogadores(true);
      setErroJogadores(null);
      try {
        const data = await listarJogadores();
        if (!canceled) setJogadores(data);
      } catch (err: unknown) {
        if (!canceled) {
          const message = err instanceof Error ? err.message : "Falha ao carregar jogadores";
          setErroJogadores(message);
        }
      } finally {
        if (!canceled) setLoadingJogadores(false);
      }
    }
    void loadJogadores();
    return () => {
      canceled = true;
    };
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Sessao</h2>
        <p>Faca login para configurar role e jogador operacional.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <h2>Sessao de Usuario</h2>
      <p style={{ color: "#475569" }}>
        Configure o contexto operacional (role e jogador) para acionar fluxos de evento.
      </p>

      <div className="card mb-3">
        <div className="card-body">
          <div><strong>Usuario:</strong> {user.displayName}</div>
          <div><strong>User ID:</strong> {user.userId}</div>
          <div><strong>Modo auth:</strong> {user.authMode}</div>
          <div><strong>Token JWT:</strong> {user.accessToken ? "ativo" : "nao definido"}</div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h3 className="h6">Role operacional</h3>
          <select
            className="form-select"
            value={user.role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 className="h6">Jogador operacional (acoes self)</h3>
          {loadingJogadores ? <p className="mb-0">Carregando jogadores...</p> : null}
          {erroJogadores ? <p className="text-danger mb-2">{erroJogadores}</p> : null}
          {!loadingJogadores && !erroJogadores ? (
            <select
              className="form-select"
              value={user.jogadorId ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                setJogadorId(raw ? Number(raw) : null);
              }}
            >
              <option value="">Nenhum (somente acoes administrativas)</option>
              {jogadores.map((jogador) => (
                <option key={jogador.id} value={jogador.id}>
                  {jogador.nome} ({jogador.id})
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
    </div>
  );
}
