// src/routes/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: JSX.Element;
};

export default function PrivateRoute({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
