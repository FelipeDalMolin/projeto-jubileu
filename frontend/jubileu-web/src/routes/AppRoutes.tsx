// src/routes/AppRoutes.tsx
import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import DiaLista from "../pages/dias/DiaLista";
import DiaDetalhe from "../pages/dias/DiaDetalhe";
import AulaPage from "../pages/dias/AulaPage";
import LoginPage from "../pages/auth/LoginPage";
import UsuarioPerfil from "../pages/UsuarioPerfil";
import JogadoresPage from "../pages/jogadores/JogadoresPage";
import DashboardsPage from "../pages/dashboards/DashboardPage";
import TurmasPage from "../pages/turmas/TurmasPage";
import TurmaPage from "../pages/turmas/TurmaPage";

function RotaProtegida() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando sessão...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // se estiver autenticado, libera as rotas filhas
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* rota pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* rotas protegidas */}
      <Route element={<RotaProtegida />}>
        {/* redireciona raiz para /dias */}
        <Route path="/" element={<Navigate to="/dias" replace />} />

        {/* Dias / Agenda */}
        <Route path="/dias" element={<DiaLista />} />
        {/* dataIso = YYYY-MM-DD */}
        <Route path="/dias/:dataIso" element={<DiaDetalhe />} />
        <Route path="/dias/:dataIso/aulas/:aulaId" element={<AulaPage />} />

        {/* Turmas */}
        <Route path="/turmas" element={<TurmasPage />} />
        <Route path="/turmas/:turmaId" element={<TurmaPage />} />

        {/* Jogadores */}
        <Route path="/jogadores" element={<JogadoresPage />} />

        {/* Dashboards */}
        <Route path="/dashboards" element={<DashboardsPage />} />

        {/* Perfil do usuário logado */}
        <Route path="/usuario" element={<UsuarioPerfil />} />

        {/* fallback para qualquer rota desconhecida (já autenticado) */}
        <Route path="*" element={<Navigate to="/dias" replace />} />
      </Route>
    </Routes>
  );
}
