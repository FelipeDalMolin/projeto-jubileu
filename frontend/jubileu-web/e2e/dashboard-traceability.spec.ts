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

async function mustJson<T>(response: Awaited<ReturnType<APIRequestContext["get"]>>): Promise<T> {
  if (!response.ok()) throw new Error(`${response.status()} ${await response.text()}`);
  return response.json() as Promise<T>;
}

test("DEV-48: jogador e partida navegam para o Evento de origem", async ({ page, request }) => {
  test.skip(!(await isApiHealthy(request)), apiHealthBlockedReason());
  const suffix = Date.now();
  const dataIso = "2026-12-24";
  const jogador = await seedJogador(request, `E2E Rastreavel ${suffix}`);
  const adversario = await seedJogador(request, `E2E Adversario ${suffix}`);
  const turma = await seedTurma(request, `E2E Rastreavel ${suffix}`);
  await seedVinculoTurmaJogador(request, turma.id, jogador.id);
  await seedVinculoTurmaJogador(request, turma.id, adversario.id);
  const evento = await seedEvento(request, dataIso, turma.id);
  const workspace = await mustJson<{ equipes: { jogadores: Array<{ jogadorId: number }> } }>(
    await request.get(`${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/workspace`),
  );
  for (const item of workspace.equipes.jogadores) {
    await mustJson(await request.put(
      `${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/jogadores/${item.jogadorId}/status`,
      { data: { status: "presente" } },
    ));
  }
  await mustJson(await request.post(`${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/start`));
  const times = await Promise.all(["A", "B"].map(async (nome) => mustJson<{ id: number }>(
    await request.post(`${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/times`, {
      data: { nome: `E2E Trace ${nome} ${suffix}` },
    }),
  )));
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
  await mustJson(await request.put(
    `${API_URL}/api/dias/${dataIso}/eventos/${evento.id}/partidas/${partida.id}/start`,
  ));
  await mustJson(await request.post(`${API_URL}/api/partidas/${partida.id}/lances`, {
    headers: { "X-User-Id": "u-admin", "X-Role": "admin" },
    data: {
      tipo: "GOL",
      jogador_id: jogador.id,
      payload: { time_id: times[0].id, minute: 1 },
      client_event_id: `trace-goal-${suffix}`,
    },
  }));

  await loginViaUi(page);
  await page.goto("/dashboard/jogadores?periodo=365");
  await page.getByPlaceholder("Buscar por nome ou detalhe...").fill(jogador.nome);
  await page.getByRole("cell", { name: jogador.nome, exact: true }).first().locator("..").click();
  await expect(page.getByRole("heading", { name: jogador.nome, exact: true })).toBeVisible();
  const jogadorLink = page.getByRole("link", { name: `Evento #${evento.id}` });
  await expect(jogadorLink).toHaveAttribute("href", `/dias/${dataIso}/eventos/${evento.id}`);

  await page.goto("/dashboard/partidas?periodo=365");
  const partidaLink = page.getByRole("link", { name: `Evento #${evento.id}` }).last();
  await expect(partidaLink).toHaveAttribute("href", `/dias/${dataIso}/eventos/${evento.id}`);
  await partidaLink.click();
  await expect(page).toHaveURL(new RegExp(`/dias/${dataIso}/eventos/${evento.id}$`));
});

test("DEV-52: dashboards exibem erro, vazio e tabela responsiva no mobile", async ({ page }) => {
  await loginViaUi(page);
  await page.route("**/api/dashboards/jogadores/resumo", (route) => route.fulfill({ status: 500, body: "erro" }));
  await page.route("**/api/dashboards/jogadores/ranking**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [] }),
  }));
  await page.goto("/dashboard/jogadores");
  await expect(page.getByText("Não foi possível carregar jogadores")).toBeVisible();

  await page.unrouteAll({ behavior: "wait" });
  await page.route("**/api/dashboards/jogadores/resumo", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ totalJogadores: 0, mediaPresenca: 0, totalGols: 0 }),
  }));
  await page.route("**/api/dashboards/jogadores/ranking**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [] }),
  }));
  await page.reload();
  await expect(page.getByText("Sem dados nesse período ou filtros")).toBeVisible();

  await page.unrouteAll({ behavior: "wait" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/dashboards/partidas/resumo", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ totalPartidas: 1, mediaGolsPorPartida: 3, totalGols: 3 }),
  }));
  await page.route("**/api/dashboards/partidas/serie-por-dia**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{ data: "2026-07-21", partidas: 1, gols: 3 }] }),
  }));
  await page.route("**/api/dashboards/partidas/lista**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [{
      partidaId: 1,
      eventoId: 1,
      dataIso: "2026-07-21",
      eventoTipo: "AULA",
      eventoStatus: "ENCERRADO",
      turmaId: 1,
      turmaNome: "Turma mobile",
      ordem: 1,
      partidaStatus: "ENCERRADA",
      timeAId: 1,
      timeANome: "Time A",
      timeBId: 2,
      timeBNome: "Time B",
      golsTimeA: 2,
      golsTimeB: 1,
    }] }),
  }));
  await page.goto("/dashboard/partidas");
  await expect(page.getByText("Partidas rastreáveis")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
