import { expect, test } from "@playwright/test";
import { apiHealthBlockedReason, isApiHealthy } from "./support/api";
import { loginViaUi } from "./support/auth";
import { expectOnlyApiDataCalls, observeApiRequests } from "./support/network";
import { testIds } from "./support/testIds";

test("DEV-39: login abre /usuario com perfil e historico operacional", async ({ page, request }) => {
  expect(await isApiHealthy(request), apiHealthBlockedReason()).toBe(true);

  const observer = observeApiRequests(page);
  try {
    await loginViaUi(page);
    await page.getByTestId(testIds.navSessao).click();
    await expect(page).toHaveURL(/\/usuario/);

    await expect(page.getByRole("heading", { name: "Usuario" })).toBeVisible();
    await expect(page.getByText("Perfil persistido")).toBeVisible();
    await expect(page.getByText("Eventos participados")).toBeVisible();

    expect(observer.apiUrls.some((url) => url.includes("/api/usuarios/me"))).toBeTruthy();
    expectOnlyApiDataCalls(observer);
  } finally {
    observer.stop();
  }
});

test("DEV-32: erro em /usuario mostra falha operacional sem flood de chamadas", async ({ page, request }) => {
  expect(await isApiHealthy(request), apiHealthBlockedReason()).toBe(true);

  await loginViaUi(page);

  let usuarioMeCalls = 0;
  await page.route("**/api/usuarios/me", async (route) => {
    usuarioMeCalls += 1;
    await route.fulfill({
      status: 503,
      contentType: "text/plain",
      body: "backend unavailable",
    });
  });

  const observer = observeApiRequests(page);
  try {
    await page.getByTestId(testIds.navSessao).click();
    await expect(page).toHaveURL(/\/usuario/);
    await expect(page.getByText(/Erro ao carregar usuario: 503/)).toBeVisible();
    expect(usuarioMeCalls).toBeGreaterThan(0);
    expect(usuarioMeCalls).toBeLessThanOrEqual(2);

    const callsAfterError = usuarioMeCalls;
    await page.waitForTimeout(1200);

    expect(usuarioMeCalls).toBe(callsAfterError);
    expectOnlyApiDataCalls(observer);
  } finally {
    observer.stop();
    await page.unroute("**/api/usuarios/me");
  }
});
