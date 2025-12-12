// src/services/jogadoresService.ts

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export type JogadorDTO = {
  id: number;
  nome: string;
  apelido?: string | null;
  status: string;
};

export type CriarJogadorInput = {
  nome: string;
  apelido?: string;
  status?: string;
};

export type AtualizarJogadorInput = {
  nome?: string;
  apelido?: string;
  status?: string;
};

export async function listarJogadores(): Promise<JogadorDTO[]> {
  const resp = await fetch(`${API_BASE_URL}/jogadores`);
  if (!resp.ok) {
    throw new Error(`Erro ao listar jogadores: ${resp.status}`);
  }
  return resp.json();
}

export async function criarJogador(
  data: CriarJogadorInput,
): Promise<JogadorDTO> {
  const payload = {
    nome: data.nome,
    apelido: data.apelido ?? null,
    status: data.status ?? "ativo",
  };

  const resp = await fetch(`${API_BASE_URL}/jogadores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => "");
    throw new Error(`Erro ao criar jogador: ${resp.status} ${msg}`);
  }

  return resp.json();
}

export async function atualizarJogador(
  id: number,
  data: AtualizarJogadorInput,
): Promise<JogadorDTO> {
  const resp = await fetch(`${API_BASE_URL}/jogadores/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => "");
    throw new Error(`Erro ao atualizar jogador: ${resp.status} ${msg}`);
  }

  return resp.json();
}

export async function excluirJogador(id: number): Promise<void> {
  const resp = await fetch(`${API_BASE_URL}/jogadores/${id}`, {
    method: "DELETE",
  });

  if (!resp.ok && resp.status !== 204) {
    const msg = await resp.text().catch(() => "");
    throw new Error(`Erro ao excluir jogador: ${resp.status} ${msg}`);
  }
}
