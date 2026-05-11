import { Navigate, Route, Routes } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";

import DiaLista from "../pages/dias/DiaLista";
import DiaDetalhe from "../pages/dias/DiaDetalhe";
import EventoPage from "../pages/eventos/EventoPage";

import LoginPage from "../pages/auth/LoginPage";
import UsuarioPerfil from "../pages/UsuarioPerfil";
import JogadoresPage from "../pages/jogadores/JogadoresPage";
import DashboardHome from "../pages/dashboard/DashboardHome";
import DashboardJogadores from "../pages/dashboard/DashboardJogadores";
import DashboardPartidas from "../pages/dashboard/DashboardPartidas";
import DashboardEstatisticas from "../pages/dashboard/DashboardEstatisticas";
import TurmasPage from "../pages/turmas/TurmasPage";
import TurmaDetalhe from "../pages/turmas/TurmaDetalhePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Navigate to="/dias" replace />} />

        <Route path="/dias" element={<DiaLista />} />
        <Route path="/dias/:dataIso" element={<DiaDetalhe />} />
        <Route path="/dias/:dataIso/eventos/:eventoId" element={<EventoPage />} />

        <Route path="/turmas" element={<TurmasPage />} />
        <Route path="/turmas/nova" element={<TurmaDetalhe />} />
        <Route path="/turmas/:turmaId" element={<TurmaDetalhe />} />

        <Route path="/jogadores" element={<JogadoresPage />} />

        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/jogadores" element={<DashboardJogadores />} />
        <Route path="/dashboard/partidas" element={<DashboardPartidas />} />
        <Route path="/dashboard/estatisticas" element={<DashboardEstatisticas />} />
        <Route path="/dashboard/trofeu" element={<Navigate to="/dashboard/estatisticas" replace />} />
        <Route path="/dashboards" element={<Navigate to="/dashboard" replace />} />

        <Route path="/usuario" element={<UsuarioPerfil />} />
        <Route path="*" element={<Navigate to="/dias" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dias" replace />} />
    </Routes>
  );
}
