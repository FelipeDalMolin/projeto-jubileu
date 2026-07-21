// src/routes/PrivateRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageShell } from "../components/layout/PageShell";
import { LoadingState } from "../components/ui/feedback";

export default function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PageShell>
        <LoadingState label="Carregando sessao..." />
      </PageShell>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
