import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Por enquanto só simula login
    if (!email || !senha) {
      alert("Preencha e-mail e senha.");
      return;
    }

    // Depois aqui vamos chamar a API / autenticação de verdade
    alert("Login simulado com sucesso!");
    navigate("/dashboards");
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Entrar</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: 320 }}>
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

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
