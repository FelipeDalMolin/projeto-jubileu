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
import TurmaDetalhe from "../pages/turmas/TurmaDetalhePage";

// Wrapper de rotas protegidas: se não tiver user, manda pro /login
function RotaProtegida() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando sessão...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* rota pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* bloco de rotas que exigem autenticação */}
      <Route element={<RotaProtegida />}>
        {/* redireciona raiz para /dias */}
        <Route path="/" element={<Navigate to="/dias" replace />} />

        {/* Dias */}
        <Route path="/dias" element={<DiaLista />} />
        <Route path="/dias/:dataIso" element={<DiaDetalhe />} />

        {/* Aula dentro do dia */}
        <Route path="/dias/:dataIso/aulas/:aulaId" element={<AulaPage />} />

        {/* Turmas */}
        <Route path="/turmas" element={<TurmasPage />} />
        <Route path="/turmas/nova" element={<TurmaDetalhe />} />
        <Route path="/turmas/:turmaId" element={<TurmaDetalhe />} />

        {/* Jogadores */}
        <Route path="/jogadores" element={<JogadoresPage />} />

        {/* Dashboards */}
        <Route path="/dashboards" element={<DashboardsPage />} />

        {/* Perfil */}
        <Route path="/usuario" element={<UsuarioPerfil />} />

        {/* fallback para qualquer rota desconhecida (já autenticado) */}
        <Route path="*" element={<Navigate to="/dias" replace />} />
      </Route>

      {/* fallback global: se nada bater, manda pra /dias */}
      <Route path="*" element={<Navigate to="/dias" replace />} />
    </Routes>
  );
}
