// src/services/turmasService.ts
import type { Turma, ParticipanteTurma } from "../types/turma";

// MOCK simples em memória
let TURMAS_MOCK: Turma[] = [
  {
    id: 1,
    nome: "Adulto",
    categoria: "Adulto",
    participantes: [
      {
        id: 1,
        jogadorId: 1,
        nome: "Felipe",
        papel: "aluno",
        ativo: true,
        podeJogar: true,
      },
      {
        id: 2,
        jogadorId: 2,
        nome: "Lucas",
        papel: "professor",
        ativo: true,
        podeJogar: true, // professor que joga
      },
      {
        id: 3,
        jogadorId: 3,
        nome: "Ex-Aluno",
        papel: "aluno",
        ativo: false,
        podeJogar: false, // histórico apenas
      },
    ],
  },
];

export async function listarTurmas(): Promise<Turma[]> {
  // depois troca por fetch(".../turmas")
  return Promise.resolve([...TURMAS_MOCK]);
}

export async function obterTurma(id: number): Promise<Turma | null> {
  const turma = TURMAS_MOCK.find((t) => t.id === id) ?? null;
  // clone para evitar mutação externa
  return Promise.resolve(turma ? { ...turma, participantes: [...turma.participantes] } : null);
}

export interface SalvarTurmaInput {
  id?: number;
  nome: string;
  categoria?: string;
  participantes: ParticipanteTurma[];
}

export async function salvarTurma(dados: SalvarTurmaInput): Promise<Turma> {
  if (dados.id) {
    TURMAS_MOCK = TURMAS_MOCK.map((t) =>
      t.id === dados.id
        ? {
            ...t,
            nome: dados.nome,
            categoria: dados.categoria,
            participantes: [...dados.participantes],
          }
        : t
    );
    const atualizado = TURMAS_MOCK.find((t) => t.id === dados.id)!;
    return Promise.resolve(atualizado);
  }

  const novoId = TURMAS_MOCK.length ? Math.max(...TURMAS_MOCK.map((t) => t.id)) + 1 : 1;
  const turma: Turma = {
    id: novoId,
    nome: dados.nome,
    categoria: dados.categoria,
    participantes: [...dados.participantes],
  };
  TURMAS_MOCK.push(turma);
  return Promise.resolve(turma);
}
