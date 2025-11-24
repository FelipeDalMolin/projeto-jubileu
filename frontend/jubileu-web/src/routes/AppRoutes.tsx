import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import DiaLista from "../pages/dias/DiaLista";
import DiaDetalhe from "../pages/dias/DiaDetalhe";
import LoginPage from "../pages/auth/LoginPage";
import UsuarioPerfil from "../pages/UsuarioPerfil";
import JogadoresPage from "../pages/JogadoresPage";
import DashboardsPage from "../pages/DashboardsPage";

function RotaProtegida({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando sessão...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dias" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dias"
        element={
          <RotaProtegida>
            <DiaLista />
          </RotaProtegida>
        }
      />
      <Route
        path="/dias/:id"
        element={
          <RotaProtegida>
            <DiaDetalhe />
          </RotaProtegida>
        }
      />

      <Route
        path="/jogadores"
        element={
          <RotaProtegida>
            <JogadoresPage />
          </RotaProtegida>
        }
      />

      <Route
        path="/dashboards"
        element={
          <RotaProtegida>
            <DashboardsPage />
          </RotaProtegida>
        }
      />

      <Route
        path="/usuario"
        element={
          <RotaProtegida>
            <UsuarioPerfil />
          </RotaProtegida>
        }
      />

      <Route path="*" element={<Navigate to="/dias" replace />} />
    </Routes>
  );
}
