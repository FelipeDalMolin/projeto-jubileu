import { expect, test, type APIRequestContext } from "./support/operatorTest";

import {
  API_URL,
  apiHealthBlockedReason,
  isApiHealthy,
  seedEvento,
  seedJogador,
  seedTurma,
  seedVinculoTurmaJogador,
} from "./support/api";
import { loginViaUi } from "./support/auth";

const adminHeaders = { "X-User-Id": "u-admin", "X-Role": "admin" };
const coachHeaders = { "X-User-Id": "u-coach", "X-Role": "treinador" };

async function mustJson<T>(response: Awaited<ReturnType<APIRequestContext["get"]>>): Promise<T> {
  if (!response.ok()) throw new Error(`${response.status()} ${await response.text()}`);
  return response.json() as Promise<T>;
}

test("DEV-49/50: AULA percorre presenca, lance e proxima partida idempotente", async ({ page, request }) => {
  expect(await isApiHealthy(request), apiHealthBlockedReason()).toBe(true);
  const suffix = Date.now();
  const dataIso = "2026-12-20";
  const jogadores = await Promise.all([
    seedJogador(request, `E2E Operacional A ${suffix}`),
    seedJogador(request, `E2E Operacional B ${suffix}`),
  ]);
  const turma = await seedTurma(request, `E2E Operacional ${suffix}`);
  await Promise.all(jogadores.map((jogador) => seedVinculoTurmaJogador(request, turma.id, jogador.id)));
  const evento = await seedEvento(request, dataIso, turma.id);

  const workspace = await mustJson<{
    equipes: { jogadores: Array<{ jogadorId: number }> };
  }>(await request.get(`${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/workspace`));
  for (const jogador of workspace.equipes.jogadores) {
    await mustJson(await request.put(
      `${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/jogadores/${jogador.jogadorId}/status`,
      { data: { status: "presente" } },
    ));
  }
  await mustJson(await request.post(`${API_URL}/api/eventos/${evento.id}/start`));
  const times = await Promise.all(["A", "B"].map(async (nome) =>
    mustJson<{ id: number }>(await request.post(`${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/times`, {
      data: { nome: `E2E ${nome} ${suffix}` },
    })),
  ));
  for (let index = 0; index < workspace.equipes.jogadores.length; index += 1) {
    await mustJson(await request.put(
      `${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/jogadores/${workspace.equipes.jogadores[index].jogadorId}/time`,
      { data: { time_id: times[index].id } },
    ));
  }
  const partida = await mustJson<{ id: number }>(await request.post(
    `${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/partidas`,
    { data: { timeAId: times[0].id, timeBId: times[1].id } },
  ));
  await mustJson(await request.post(
    `${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/partidas/${partida.id}/start`,
  ));
  await mustJson(await request.post(`${API_URL}/api/partidas/${partida.id}/lances`, {
    headers: adminHeaders,
    data: {
      tipo: "GOL",
      jogador_id: jogadores[0].id,
      payload: { time_id: times[0].id, minute: 1 },
      client_event_id: `e2e-lance-${suffix}`,
    },
  }));
  await mustJson(await request.post(
    `${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/partidas/${partida.id}/end`,
  ));
  const rotation = await mustJson<{ version: number }>(await request.get(
    `${API_URL}/api/eventos/${evento.id}/rotacao/estado`,
    { headers: adminHeaders },
  ));
  const nextPayload = {
    partida_origem_id: partida.id,
    time_a_id: times[0].id,
    time_b_id: times[1].id,
    expected_rotation_version: rotation.version,
    client_command_id: `e2e-next-${suffix}`,
  };
  const first = await mustJson<{ partida: { id: number } }>(await request.post(
    `${API_URL}/api/eventos/${evento.id}/partidas/proxima`,
    { headers: adminHeaders, data: nextPayload },
  ));
  const retry = await mustJson<{ partida: { id: number } }>(await request.post(
    `${API_URL}/api/eventos/${evento.id}/partidas/proxima`,
    { headers: adminHeaders, data: nextPayload },
  ));
  expect(retry.partida.id).toBe(first.partida.id);

  await loginViaUi(page);
  await page.goto(`/dias/${dataIso}/eventos/${evento.id}`);
  for (const tab of ["Presenca", "Equipes", "Fila", "Partida Atual", "Historico"]) {
    await expect(page.getByRole("button", { name: tab, exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Partida Atual", exact: true }).click();
  await expect(page.getByText(`Partida ao vivo #${first.partida.id}`)).toBeVisible();
});

test("DEV-32: canais inativos nao fazem polling e 401 tem retry limitado", async ({ page, request }) => {
  expect(await isApiHealthy(request), apiHealthBlockedReason()).toBe(true);
  const suffix = Date.now();
  const dataIso = "2026-12-21";
  const jogador = await seedJogador(request, `E2E Polling ${suffix}`);
  const turma = await seedTurma(request, `E2E Polling ${suffix}`);
  await seedVinculoTurmaJogador(request, turma.id, jogador.id);
  const evento = await seedEvento(request, dataIso, turma.id);
  await loginViaUi(page);

  let rotationCalls = 0;
  await page.route(`**/api/eventos/${evento.id}/rotacao/estado`, async (route) => {
    rotationCalls += 1;
    await route.fulfill({ status: 401, contentType: "application/json", body: '{"detail":"expired"}' });
  });
  await page.goto(`/dias/${dataIso}/eventos/${evento.id}`);
  await page.waitForTimeout(500);
  expect(rotationCalls).toBe(0);

  await page.getByRole("button", { name: "Fila", exact: true }).click();
  await expect(page.getByText(/Sessao invalida ou expirada/)).toHaveCount(1);
  expect(rotationCalls).toBeGreaterThan(0);
  expect(rotationCalls).toBeLessThanOrEqual(2);

  const afterFailure = rotationCalls;
  await page.getByRole("button", { name: "Historico", exact: true }).click();
  await page.waitForTimeout(3_500);
  expect(rotationCalls).toBe(afterFailure);
});

test("DEV-31/50: JOGO_LIVRE entra por RSVP, chegada, lance e proxima partida", async ({ page, request }) => {
  expect(await isApiHealthy(request), apiHealthBlockedReason()).toBe(true);
  const suffix = Date.now();
  const dataIso = "2026-12-23";
  const jogadores = await Promise.all([
    seedJogador(request, `E2E Livre A ${suffix}`),
    seedJogador(request, `E2E Livre B ${suffix}`),
  ]);
  const evento = await mustJson<{ id: number }>(await request.post(
    `${API_URL}/api/dias/${dataIso}/eventos`,
    { data: { tipo: "JOGO_LIVRE", horario_inicio: "19:00", horario_fim: "20:00", status: "PLANEJADO" } },
  ));

  try {
    await mustJson(await request.put(`${API_URL}/api/usuarios/me/jogador`, {
      headers: adminHeaders,
      data: { jogador_id: jogadores[0].id },
    }));
    await mustJson(await request.put(`${API_URL}/api/usuarios/me/jogador`, {
      headers: coachHeaders,
      data: { jogador_id: jogadores[1].id },
    }));
    await mustJson(await request.post(`${API_URL}/api/eventos/${evento.id}/rsvp`, { headers: adminHeaders }));
    await mustJson(await request.post(`${API_URL}/api/eventos/${evento.id}/rsvp`, { headers: coachHeaders }));
    await mustJson(await request.post(`${API_URL}/api/eventos/${evento.id}/start`, { headers: adminHeaders }));
    const chegadaA = await mustJson<{ participante: { arrival_seq: number } }>(await request.post(
      `${API_URL}/api/eventos/${evento.id}/checkin`,
      { headers: adminHeaders },
    ));
    const chegadaB = await mustJson<{ participante: { arrival_seq: number } }>(await request.post(
      `${API_URL}/api/eventos/${evento.id}/checkin`,
      { headers: coachHeaders },
    ));
    expect(chegadaA.participante.arrival_seq).toBeLessThan(chegadaB.participante.arrival_seq);

    const seed = await mustJson<{
      partida: { id: number; time_a_id: number; time_b_id: number };
    }>(await request.post(`${API_URL}/api/eventos/${evento.id}/partidas/seed`, {
      headers: adminHeaders,
      data: { mode: "arrival_first", players_count: 2, team_size: 1 },
    }));
    await mustJson(await request.post(`${API_URL}/api/partidas/${seed.partida.id}/lances`, {
      headers: adminHeaders,
      data: {
        tipo: "GOL",
        jogador_id: jogadores[0].id,
        payload: { time_id: seed.partida.time_a_id, minute: 1 },
        client_event_id: `e2e-livre-lance-${suffix}`,
      },
    }));
    await mustJson(await request.post(
      `${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/partidas/${seed.partida.id}/end`,
    ));
    const rotation = await mustJson<{ version: number }>(await request.get(
      `${API_URL}/api/eventos/${evento.id}/rotacao/estado`,
      { headers: adminHeaders },
    ));
    const next = await mustJson<{ partida: { id: number } }>(await request.post(
      `${API_URL}/api/eventos/${evento.id}/partidas/proxima`,
      {
        headers: adminHeaders,
        data: {
          partida_origem_id: seed.partida.id,
          time_a_id: seed.partida.time_a_id,
          time_b_id: seed.partida.time_b_id,
          expected_rotation_version: rotation.version,
          client_command_id: `e2e-livre-next-${suffix}`,
        },
      },
    ));

    await loginViaUi(page);
    await page.goto(`/dias/${dataIso}/eventos/${evento.id}`);
    await page.getByRole("button", { name: "Partida Atual", exact: true }).click();
    await expect(page.getByText(`Partida ao vivo #${next.partida.id}`)).toBeVisible();
  } finally {
    await request.put(`${API_URL}/api/usuarios/me/jogador`, {
      headers: adminHeaders,
      data: { jogador_id: null },
    });
    await request.put(`${API_URL}/api/usuarios/me/jogador`, {
      headers: coachHeaders,
      data: { jogador_id: null },
    });
  }
});

test("DEV-32: polling respeita orcamento por canal em janela de 30 segundos", async ({ page, request }) => {
  test.setTimeout(50_000);
  expect(await isApiHealthy(request), apiHealthBlockedReason()).toBe(true);
  const suffix = Date.now();
  const dataIso = "2026-12-22";
  const jogador = await seedJogador(request, `E2E Budget ${suffix}`);
  const turma = await seedTurma(request, `E2E Budget ${suffix}`);
  await seedVinculoTurmaJogador(request, turma.id, jogador.id);
  const evento = await seedEvento(request, dataIso, turma.id);
  await loginViaUi(page);

  let workspaceCalls = 0;
  let rotationCalls = 0;
  page.on("request", (networkRequest) => {
    if (networkRequest.url().includes(`/api/dias/${dataIso}/eventos/${evento.id}/workspace`)) workspaceCalls += 1;
    if (networkRequest.url().includes(`/api/eventos/${evento.id}/rotacao/estado`)) rotationCalls += 1;
  });
  await page.goto(`/dias/${dataIso}/eventos/${evento.id}`);
  await page.getByRole("button", { name: "Fila", exact: true }).click();
  await page.waitForTimeout(500);
  workspaceCalls = 0;
  rotationCalls = 0;

  await page.waitForTimeout(30_000);
  expect(workspaceCalls).toBeLessThanOrEqual(1 + Math.ceil(30 / 4));
  expect(rotationCalls).toBeLessThanOrEqual(1 + Math.ceil(30 / 3));

  await page.getByRole("button", { name: "Historico", exact: true }).click();
  await page.waitForTimeout(500);
  const rotationAfterHistory = rotationCalls;
  await page.waitForTimeout(3_500);
  expect(rotationCalls).toBe(rotationAfterHistory);
});
