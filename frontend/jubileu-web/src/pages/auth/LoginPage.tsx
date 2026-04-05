import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "../../hooks/useAuthSession";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthSession();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!username || !senha) {
      alert("Preencha usuario e senha.");
      return;
    }

    try {
      setSubmitting(true);
      await login(username, senha);
      navigate("/dias");
    } catch (err) {
      console.error(err);
      alert("Nao foi possivel entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 420, margin: "40px auto" }}>
      <h2 style={{ marginBottom: 16 }}>Login - Projeto Jubileu</h2>
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
        Contas JWT de desenvolvimento: admin/admin123, coach/coach123, aux/aux123, user/user123.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Usuario</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
