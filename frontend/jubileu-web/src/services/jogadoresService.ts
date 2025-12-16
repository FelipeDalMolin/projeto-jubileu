// src/services/jogadoresService.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type JogadorDTO = {
  id: number;
  nome: string;
  apelido?: string | null;
  status: string;
};

export type CriarJogadorInput = {
  nome: string;
  apelido?: string | null;
  status?: string;
};

export type AtualizarJogadorInput = {
  nome?: string;
  apelido?: string | null;
  status?: string;
};

function url(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function listarJogadores(): Promise<JogadorDTO[]> {
  const resp = await fetch(url(`/jogadores`));
  if (!resp.ok) {
    throw new Error(`Erro ao listar jogadores: ${resp.status}`);
  }
  return resp.json();
}

export async function criarJogador(
  data: CriarJogadorInput
): Promise<JogadorDTO> {
  const resp = await fetch(url(`/jogadores`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    throw new Error(`Erro ao criar jogador: ${resp.status}`);
  }
  return resp.json();
}

export async function atualizarJogador(
  id: number,
  data: AtualizarJogadorInput
): Promise<JogadorDTO> {
  const resp = await fetch(url(`/jogadores/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    throw new Error(`Erro ao atualizar jogador: ${resp.status}`);
  }
  return resp.json();
}

export async function deletarJogador(id: number): Promise<void> {
  const resp = await fetch(url(`/jogadores/${id}`), { method: "DELETE" });
  if (!resp.ok) {
    throw new Error(`Erro ao deletar jogador: ${resp.status}`);
  }
}
