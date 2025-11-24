// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type UserRole = "coach" | "admin" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "jubileu:authUser";

function carregarUsuarioSalvo(): User | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => carregarUsuarioSalvo());
  const [loading] = useState(false);

  // Login SIMULADO (futuro: trocar por chamada à API)
  async function login(email: string, senha: string) {
    void senha; // placeholder até implementarmos autenticação real

    // Simula latência
    await new Promise((resolve) => setTimeout(resolve, 300));

    const fakeUser: User = {
      id: "1",
      name: email.split("@")[0] || "Treinador",
      email,
      role: "coach",
    };

    setUser(fakeUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fakeUser));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
