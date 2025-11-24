import { Routes, Route, Navigate } from "react-router-dom";
import DiaLista from "../pages/dias/DiaLista";
import DiaDetalhe from "../pages/dias/DiaDetalhe";
import LoginPage from "../pages/auth/LoginPage"; // ⬅️ troquei aqui
import UsuarioPerfil from "../pages/UsuarioPerfil";

export default function AppRoutes() {
  return (
    <Routes>
      {/* se quiser começar pelo login: */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/dias" element={<DiaLista />} />
      <Route path="/dias/:id" element={<DiaDetalhe />} />

      <Route path="/usuario" element={<UsuarioPerfil />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
