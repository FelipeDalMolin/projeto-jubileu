import { expect, test } from "@playwright/test";
import { apiHealth, isApiHealthy } from "./support/api";
import { loginViaUi } from "./support/auth";
import {
  expectAtLeastOneRequestId,
  expectOnlyApiDataCalls,
  observeApiRequests,
} from "./support/network";
import { testIds } from "./support/testIds";

test("E2E-CONTRACT: /api/health responde com X-Request-ID", async ({ request }) => {
  const response = await apiHealth(request);
  test.skip(!response, "blocked: E2E_API_URL nao respondeu /api/health");

  expect(response!.ok()).toBeTruthy();
  expect(response!.headers()["x-request-id"]).toBeTruthy();
});

test("E2E-CONTRACT: navegador nao gera /api/api e usa /api para dados", async ({ page }) => {
  const observer = observeApiRequests(page);
  try {
    await loginViaUi(page);
    await expect(page.getByTestId(testIds.pageCalendario)).toBeVisible();
    await page.waitForTimeout(500);

    expect(observer.apiUrls.length, "expected at least one browser API call").toBeGreaterThan(0);
    expectOnlyApiDataCalls(observer);
  } finally {
    observer.stop();
  }
});

test("E2E-CONTRACT: responses observaveis carregam X-Request-ID", async ({ page, request }) => {
  test.skip(!(await isApiHealthy(request)), "blocked: API local indisponivel para validar X-Request-ID via browser");

  const observer = observeApiRequests(page);
  try {
    await loginViaUi(page);
    await expect(page.getByTestId(testIds.pageCalendario)).toBeVisible();
    await page.waitForTimeout(500);

    expectAtLeastOneRequestId(observer);
  } finally {
    observer.stop();
  }
});
