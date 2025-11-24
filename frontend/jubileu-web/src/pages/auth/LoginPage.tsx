import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dias", { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !senha) {
      alert("Preencha e-mail e senha.");
      return;
    }

    try {
      setSubmitting(true);
      await login(email, senha); // chama nosso login do contexto
      navigate("/dias"); // após login, manda para a tela de dias
    } catch (err) {
      console.error(err);
      alert("Não foi possível entrar (login simulado).");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 420,
        margin: "60px auto",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
      }}
    >
      <h2 style={{ marginBottom: 8 }}>Login - Projeto Jubileu</h2>
      <p style={{ marginTop: 0, color: "#475569" }}>
        A autenticação ainda é simulada. Use qualquer e-mail e senha para entrar.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ display: "block", marginBottom: 4 }}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ display: "block", marginBottom: 4 }}>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <button type="submit" disabled={submitting} style={{ marginTop: 8 }}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
