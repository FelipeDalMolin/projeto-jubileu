import { expect, test } from "@playwright/test";
import { apiHealthBlockedReason, isApiHealthy } from "./support/api";
import { loginViaUi } from "./support/auth";
import { expectOnlyApiDataCalls, observeApiRequests } from "./support/network";
import { testIds } from "./support/testIds";

test("E2E-UC02: criar jogador pela UI chama /api/jogadores", async ({ page, request }) => {
  expect(await isApiHealthy(request), apiHealthBlockedReason()).toBe(true);

  const observer = observeApiRequests(page);
  const nome = `E2E Jogador UI ${Date.now()}`;
  try {
    await loginViaUi(page);
    await page.getByTestId(testIds.navJogadores).click();
    await expect(page.getByTestId(testIds.pageJogadores)).toBeVisible();

    await page.getByTestId(testIds.formJogador).locator("input").nth(0).fill(nome);
    await page.getByTestId(testIds.formJogador).locator("input").nth(1).fill("UI");
    const createResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/jogadores") &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    await page.getByTestId(testIds.buttonSalvarJogador).click();
    await createResponse;

    await expect(page.getByText(nome)).toBeVisible();
    expect(observer.apiUrls.some((url) => url.endsWith("/api/jogadores"))).toBeTruthy();
    expectOnlyApiDataCalls(observer);
  } finally {
    observer.stop();
  }
});

test("E2E-UC03: criar turma pela UI chama /api/turmas", async ({ page, request }) => {
  expect(await isApiHealthy(request), apiHealthBlockedReason()).toBe(true);

  const observer = observeApiRequests(page);
  const nome = `E2E Turma UI ${Date.now()}`;
  try {
    await loginViaUi(page);
    await page.getByTestId(testIds.navTurmas).click();
    await expect(page.getByTestId(testIds.pageTurmas)).toBeVisible();

    await page.getByRole("button", { name: "+ Nova turma" }).click();
    await page.getByTestId(testIds.formTurma).getByLabel("Nome da turma").fill(nome);
    const createResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/turmas") &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    await page.getByTestId(testIds.buttonSalvarTurma).click();
    await createResponse;

    await expect(page.getByText(nome)).toBeVisible();
    expect(observer.apiUrls.some((url) => url.endsWith("/api/turmas"))).toBeTruthy();
    expectOnlyApiDataCalls(observer);
  } finally {
    observer.stop();
  }
});
