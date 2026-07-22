import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ErrorState } from "../../components/ui/feedback";
import { Field } from "../../components/ui/form";
import { useAuthSession } from "../../hooks/useAuthSession";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuthSession();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (!username || !senha) {
      setErro("Preencha usuario e senha.");
      return;
    }

    try {
      setSubmitting(true);
      await login(username, senha);
      navigate("/dias");
    } catch (err) {
      console.error(err);
      setErro("Nao foi possivel entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main data-testid="page-login" className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Login - Projeto Jubileu</CardTitle>
          <CardDescription>
            {import.meta.env.DEV
              ? "Contas de desenvolvimento: admin/admin123, coach/coach123, aux/aux123, user/user123."
              : "Entre com as credenciais fornecidas pelo administrador."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field
              label="Usuario"
              data-testid="input-login-usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
            />

            <Field
              label="Senha"
              data-testid="input-login-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={submitting}
            />

            {erro ? <ErrorState message={erro} /> : null}

            <Button data-testid="button-login" type="submit" disabled={submitting} className="w-full">
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
