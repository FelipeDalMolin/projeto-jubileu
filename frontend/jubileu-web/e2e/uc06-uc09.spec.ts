import { test } from "@playwright/test";

test.skip(
  "E2E-UC06: presenca/check-in/check-out pela UI",
  async () => {
    // pending: requer fixture completa de participante vinculado a usuario/jogador e evento em estado adequado.
  },
);

test.skip(
  "E2E-UC07: formacao de equipes/rotacao pela UI",
  async () => {
    // pending: requer seed auditavel de participantes, presentes, filas e permissoes de treinador.
  },
);

test.skip(
  "E2E-UC08/UC09: operar partida e registrar lance pela UI",
  async () => {
    // pending: requer fixture completa de equipes, partida em andamento e jogadores elegiveis para lances.
  },
);
