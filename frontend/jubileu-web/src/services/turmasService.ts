import type { JogadorDTO } from "./jogadoresService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type Turma = { id: number; nome: string };

export type TurmaJogador = {
  id: number;
  nome: string;
  apelido?: string | null;
  status: string;
};

export async function listarTurmas(): Promise<Turma[]> {
  const resp = await fetch(`${API_BASE_URL}/turmas/`);
  if (!resp.ok) throw new Error("Erro ao listar turmas");
  return resp.json();
}

export async function obterTurma(id: number): Promise<Turma> {
  const resp = await fetch(`${API_BASE_URL}/turmas/${id}`);
  if (!resp.ok) throw new Error("Turma não encontrada");
  return resp.json();
}

export async function criarTurma(data: { nome: string }): Promise<Turma> {
  const resp = await fetch(`${API_BASE_URL}/turmas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error("Erro ao criar turma");
  return resp.json();
}

export async function atualizarTurma(id: number, data: { nome?: string }): Promise<Turma> {
  const resp = await fetch(`${API_BASE_URL}/turmas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error("Erro ao atualizar turma");
  return resp.json();
}

export async function listarJogadoresDaTurma(turmaId: number): Promise<JogadorDTO[]> {
  const resp = await fetch(`${API_BASE_URL}/turmas/${turmaId}/jogadores`);
  if (!resp.ok) throw new Error("Erro ao listar jogadores da turma");
  return resp.json();
}

export async function adicionarJogadorNaTurma(turmaId: number, jogadorId: number) {
  const resp = await fetch(`${API_BASE_URL}/turmas/${turmaId}/jogadores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jogador_id: jogadorId }),
  });
  if (!resp.ok) throw new Error("Erro ao adicionar jogador");
}

export async function removerJogadorDaTurma(turmaId: number, jogadorId: number) {
  const resp = await fetch(`${API_BASE_URL}/turmas/${turmaId}/jogadores/${jogadorId}`, {
    method: "DELETE",
  });
  if (!resp.ok) throw new Error("Erro ao remover jogador");
}
