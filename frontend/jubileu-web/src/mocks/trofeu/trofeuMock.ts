import type { Jogador, Turma, RegistroEvento } from "../../domain/trofeu/trofeuTypes";

export const trofeuJogadores: Jogador[] = [
  { id: 1, nome: "João Lima", apelido: "JL", status: "ativo" },
  { id: 2, nome: "Marina Souza", apelido: "Mari", status: "ativo" },
  { id: 3, nome: "Rafa Costa", apelido: "Rafa", status: "ativo" },
  { id: 4, nome: "Beatriz Melo", apelido: "Bia", status: "ativo" },
  { id: 5, nome: "Pedro Reis", apelido: "Pedrinho", status: "ativo" },
  { id: 6, nome: "Lucas Xavier", apelido: "Xavier", status: "ativo" },
  { id: 7, nome: "Helena Dias", apelido: "Helena", status: "ativo" },
  { id: 8, nome: "Caio Prado", apelido: "Caio", status: "ativo" },
];

export const trofeuTurmas: Turma[] = [
  { id: 10, nome: "Adulto" },
  { id: 11, nome: "Sub-11" },
  { id: 12, nome: "Sub-13" },
  { id: 13, nome: "Feminino" },
];

// Registros cobrindo ~60 dias para permitir comparação 30/30
export const trofeuRegistros: RegistroEvento[] = [
  {
    dataIso: "2025-01-20",
    turmaId: 10,
    presencas: [
      { jogadorId: 1, participou: true, resultado: "V", gols: 2, cartoes2min: 0, chilique: 0 },
      { jogadorId: 3, participou: true, resultado: "V", gols: 1, cartoes2min: 1, chilique: 0 },
      { jogadorId: 6, participou: true, resultado: "V", gols: 0, cartoes2min: 0, chilique: 0 },
    ],
  },
  {
    dataIso: "2025-01-12",
    turmaId: 13,
    presencas: [
      { jogadorId: 4, participou: true, resultado: "E", gols: 1, cartoes2min: 0, chilique: 0 },
      { jogadorId: 7, participou: true, resultado: "E", gols: 0, cartoes2min: 0, chilique: 0 },
    ],
  },
  {
    dataIso: "2025-01-05",
    turmaId: 11,
    presencas: [
      { jogadorId: 2, participou: true, resultado: "V", gols: 1, cartoes2min: 0, chilique: 0 },
      { jogadorId: 5, participou: true, resultado: "V", gols: 0, cartoes2min: 0, chilique: 1 },
      { jogadorId: 8, participou: true, resultado: "V", gols: 2, cartoes2min: 0, chilique: 0 },
    ],
  },
  {
    dataIso: "2024-12-28",
    turmaId: 10,
    presencas: [
      { jogadorId: 1, participou: true, resultado: "E", gols: 0, cartoes2min: 0, chilique: 0 },
      { jogadorId: 3, participou: true, resultado: "E", gols: 0, cartoes2min: 0, chilique: 0 },
      { jogadorId: 6, participou: false, resultado: null, gols: 0, cartoes2min: 0, chilique: 0 },
    ],
  },
  {
    dataIso: "2024-12-18",
    turmaId: 10,
    presencas: [
      { jogadorId: 1, participou: true, resultado: "D", gols: 1, cartoes2min: 1, chilique: 0 },
      { jogadorId: 3, participou: true, resultado: "D", gols: 0, cartoes2min: 0, chilique: 1 },
      { jogadorId: 6, participou: true, resultado: "D", gols: 0, cartoes2min: 0, chilique: 0 },
    ],
  },
  {
    dataIso: "2024-12-10",
    turmaId: 11,
    presencas: [
      { jogadorId: 2, participou: true, resultado: "E", gols: 0, cartoes2min: 0, chilique: 0 },
      { jogadorId: 5, participou: true, resultado: "E", gols: 1, cartoes2min: 0, chilique: 0 },
    ],
  },
  {
    dataIso: "2024-12-03",
    turmaId: 13,
    presencas: [
      { jogadorId: 4, participou: true, resultado: "V", gols: 2, cartoes2min: 0, chilique: 0 },
      { jogadorId: 7, participou: true, resultado: "V", gols: 0, cartoes2min: 0, chilique: 0 },
    ],
  },
  {
    dataIso: "2024-11-25",
    turmaId: 12,
    presencas: [
      { jogadorId: 8, participou: true, resultado: "D", gols: 1, cartoes2min: 0, chilique: 0 },
      { jogadorId: 2, participou: true, resultado: "D", gols: 0, cartoes2min: 0, chilique: 0 },
    ],
  },
];
