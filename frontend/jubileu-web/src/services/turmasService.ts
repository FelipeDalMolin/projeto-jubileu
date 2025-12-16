// src/services/turmasService.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type Turma = {
  id: number;
  nome: string;
};

export type TurmaCreate = {
  nome: string;
};

export type TurmaUpdate = {
  nome?: string;
};

export type TurmaJogador = {
  id: number;
  nome: string;
  apelido?: string | null;
  status: string;
};

function url(path: string) {
  // evita 307 por falta de barra final em /turmas/
  return `${API_BASE_URL}${path}`;
}

export async function listarTurmas(): Promise<Turma[]> {
  const resp = await fetch(url(`/turmas/`));
  if (!resp.ok) throw new Error(`Erro ao listar turmas (${resp.status})`);
  return resp.json();
}

export async function obterTurma(id: number): Promise<Turma> {
  const resp = await fetch(url(`/turmas/${id}`));
  if (!resp.ok) throw new Error(`Turma não encontrada (${resp.status})`);
  return resp.json();
}

export async function criarTurma(data: TurmaCreate): Promise<Turma> {
  const resp = await fetch(url(`/turmas/`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error(`Erro ao criar turma (${resp.status})`);
  return resp.json();
}

export async function atualizarTurma(id: number, data: TurmaUpdate): Promise<Turma> {
  const resp = await fetch(url(`/turmas/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error(`Erro ao atualizar turma (${resp.status})`);
  return resp.json();
}

export async function deletarTurma(id: number): Promise<void> {
  const resp = await fetch(url(`/turmas/${id}`), { method: "DELETE" });
  if (!resp.ok) throw new Error(`Erro ao deletar turma (${resp.status})`);
}

export async function listarJogadoresDaTurma(turmaId: number): Promise<TurmaJogador[]> {
  const resp = await fetch(url(`/turmas/${turmaId}/jogadores`));
  if (!resp.ok) throw new Error(`Erro ao listar jogadores da turma (${resp.status})`);
  return resp.json();
}
