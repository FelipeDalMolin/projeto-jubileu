import { Routes, Route, Navigate } from "react-router-dom";
import DiaLista from "../pages/dias/DiaLista";
import DiaDetalhe from "../pages/dias/DiaDetalhe";
import Login from "../pages/Login";
import UsuarioPerfil from "../pages/UsuarioPerfil";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Raiz redireciona para /dias por enquanto */}
      <Route path="/" element={<Navigate to="/dias" replace />} />

      <Route path="/dias" element={<DiaLista />} />
      <Route path="/dias/:id" element={<DiaDetalhe />} />

      <Route path="/login" element={<Login />} />
      <Route path="/usuario" element={<UsuarioPerfil />} />
    </Routes>
  );
}
