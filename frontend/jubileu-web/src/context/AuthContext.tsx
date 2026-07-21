/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCurrentUser, loginAuth, logoutAuth, type AuthMeResponse, type UserRole } from "../services/authService";

export type UserSession = {
  userId: string;
  username?: string | null;
  email?: string | null;
  role: UserRole;
  jogadorId: number | null;
  displayName: string;
};

export type RequestAuth = { userId: string; role: UserRole; jogadorId?: number };

type AuthContextType = {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  getRequestAuth: () => RequestAuth | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toSession(me: AuthMeResponse): UserSession {
  return {
    userId: me.user_id,
    username: me.username,
    email: me.email,
    role: me.role,
    jogadorId: me.jogador_id,
    displayName: me.display_name ?? me.username ?? me.user_id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const restore = useCallback(async () => {
    try {
      setUser(toSession(await getCurrentUser()));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void restore();
    const expired = () => setUser(null);
    window.addEventListener("jubileu:session-expired", expired);
    return () => window.removeEventListener("jubileu:session-expired", expired);
  }, [restore]);

  async function login(username: string, senha: string) {
    if (!username.trim() || !senha) throw new Error("Informe usuario e senha.");
    setUser(toSession(await loginAuth(username.trim(), senha)));
  }

  async function logout() {
    try {
      await logoutAuth();
    } finally {
      setUser(null);
    }
  }

  const getRequestAuth = useCallback(
    () => user ? { userId: user.userId, role: user.role, jogadorId: user.jogadorId ?? undefined } : null,
    [user],
  );

  const value = useMemo(() => ({ user, loading, login, logout, getRequestAuth }), [user, loading, getRequestAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return value;
}
