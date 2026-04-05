/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginAuth,
  type UserRole,
} from "../services/authService";

export type AuthMode = "jwt" | "legacy";

export type UserSession = {
  userId: string;
  role: UserRole;
  jogadorId: number | null;
  accessToken: string | null;
  authMode: AuthMode;
  displayName: string;
};

export type RequestAuth = {
  userId: string;
  role: UserRole;
  jogadorId?: number;
  accessToken?: string | null;
};

type AuthContextType = {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, senha: string) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setJogadorId: (jogadorId: number | null) => void;
  getRequestAuth: () => RequestAuth | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "jubileu:authSession";

function parseStoredSession(raw: string | null): UserSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UserSession>;
    if (!parsed.userId || !parsed.role) return null;
    return {
      userId: parsed.userId,
      role: parsed.role,
      jogadorId: parsed.jogadorId ?? null,
      accessToken: parsed.accessToken ?? null,
      authMode: parsed.authMode ?? "legacy",
      displayName: parsed.displayName ?? parsed.userId,
    };
  } catch {
    return null;
  }
}

function persistSession(session: UserSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() =>
    parseStoredSession(localStorage.getItem(STORAGE_KEY)),
  );
  const loading = false;

  async function login(username: string, senha: string) {
    const normalized = username.trim();
    if (!normalized || !senha) {
      throw new Error("Informe usuario e senha.");
    }

    try {
      const token = await loginAuth(normalized, senha);
      const me = await getCurrentUser(token.access_token);

      const session: UserSession = {
        userId: me.user_id,
        role: me.role,
        jogadorId: me.jogador_id ?? null,
        accessToken: token.access_token,
        authMode: "jwt",
        displayName: normalized,
      };

      setUser(session);
      persistSession(session);
      return;
    } catch {
      const fallback: UserSession = {
        userId: normalized,
        role: "user",
        jogadorId: null,
        accessToken: null,
        authMode: "legacy",
        displayName: normalized,
      };
      setUser(fallback);
      persistSession(fallback);
    }
  }

  function logout() {
    setUser(null);
    persistSession(null);
  }

  function setRole(role: UserRole) {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, role };
      persistSession(next);
      return next;
    });
  }

  function setJogadorId(jogadorId: number | null) {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, jogadorId };
      persistSession(next);
      return next;
    });
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      login,
      logout,
      setRole,
      setJogadorId,
      getRequestAuth: () =>
        user
          ? {
              userId: user.userId,
              role: user.role,
              jogadorId: user.jogadorId ?? undefined,
              accessToken: user.accessToken,
            }
          : null,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
