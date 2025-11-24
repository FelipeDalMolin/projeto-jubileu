import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

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
    <div style={{ padding: 40, maxWidth: 360, margin: "40px auto" }}>
      <h2 style={{ marginBottom: 16 }}>Login - Projeto Jubileu</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
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
