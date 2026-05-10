// src/types/turma.ts
export type PapelParticipanteTurma = "aluno" | "professor";

export interface ParticipanteTurma {
  id: number; // pode ser igual ao jogadorId por enquanto
  jogadorId: number;
  nome: string;

  papel: PapelParticipanteTurma; // aluno / professor
  ativo: boolean;                // ex-aluno = false
  podeJogar: boolean;            // se false, não vai pra EventoPage
}

export interface Turma {
  id: number;
  nome: string;
  categoria?: string; // "Adulto", "Sub-11", etc.
  participantes: ParticipanteTurma[];
}
