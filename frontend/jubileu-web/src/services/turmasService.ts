// src/services/turmasService.ts
import type { JogadorDTO } from "./jogadoresService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * Tipos
 */
export type Turma = {
  id: number;
  nome: string;
};

export type CriarTurmaInput = {
  nome: string;
};

export type AtualizarTurmaInput = {
  nome?: string;
};

export type AddJogadorTurmaInput = {
  jogador_id: number;
};

/**
 * Helper padrão para requests
 */
async function requestJson<T>(
  path: string,
  init?: RequestInit,
  errorMessage: string = "Erro na requisição",
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const resp = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      // Só seta JSON se o caller já estiver mandando body
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (!resp.ok) {
    // tenta enriquecer o erro com payload do backend
    const text = await resp.text().catch(() => "");
    throw new Error(
      `${errorMessage} (HTTP ${resp.status})${text ? ` - ${text}` : ""}`,
    );
  }

  // Para endpoints sem body (204, etc.)
  if (resp.status === 204) {
    return undefined as T;
  }

  // Alguns backends podem retornar vazio com 200, então tentamos parsear com segurança
  const contentType = resp.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await resp.text().catch(() => "");
    // Se não for JSON, ainda retornamos como "unknown" (ou estoura)
    return (text as unknown) as T;
  }

  return resp.json() as Promise<T>;
}

/**
 * Rotas Turmas
 * Observação: mantive /turmas/ com barra final como você já usa.
 */
export async function listarTurmas(): Promise<Turma[]> {
  return requestJson<Turma[]>("/turmas/", undefined, "Erro ao listar turmas");
}

export async function obterTurma(id: number): Promise<Turma> {
  return requestJson<Turma>(`/turmas/${id}`, undefined, "Turma não encontrada");
}

export async function criarTurma(data: CriarTurmaInput): Promise<Turma> {
  const payload: CriarTurmaInput = { nome: data.nome };
  return requestJson<Turma>(
    "/turmas/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Erro ao criar turma",
  );
}

export async function atualizarTurma(
  id: number,
  data: AtualizarTurmaInput,
): Promise<Turma> {
  const payload: AtualizarTurmaInput = {};
  if (typeof data.nome === "string") payload.nome = data.nome;

  return requestJson<Turma>(
    `/turmas/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "Erro ao atualizar turma",
  );
}

/**
 * Jogadores da Turma
 */
export async function listarJogadoresDaTurma(
  turmaId: number,
): Promise<JogadorDTO[]> {
  return requestJson<JogadorDTO[]>(
    `/turmas/${turmaId}/jogadores`,
    undefined,
    "Erro ao listar jogadores da turma",
  );
}

export async function adicionarJogadorNaTurma(
  turmaId: number,
  jogadorId: number,
): Promise<void> {
  const payload: AddJogadorTurmaInput = { jogador_id: jogadorId };

  await requestJson<void>(
    `/turmas/${turmaId}/jogadores`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Erro ao adicionar jogador",
  );
}

export async function removerJogadorDaTurma(
  turmaId: number,
  jogadorId: number,
): Promise<void> {
  await requestJson<void>(
    `/turmas/${turmaId}/jogadores/${jogadorId}`,
    { method: "DELETE" },
    "Erro ao remover jogador",
  );
}
