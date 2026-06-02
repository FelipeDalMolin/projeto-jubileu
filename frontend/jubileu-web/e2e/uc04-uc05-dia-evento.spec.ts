import { expect, test } from "@playwright/test";
import { isApiHealthy, seedDia, seedTurma } from "./support/api";
import { loginViaUi } from "./support/auth";
import { expectOnlyApiDataCalls, observeApiRequests } from "./support/network";
import { testIds } from "./support/testIds";

test("E2E-UC04/UC05: abrir dia e criar evento/aula pela UI", async ({ page, request }) => {
  test.skip(!(await isApiHealthy(request)), "blocked: API local indisponivel para dia/evento via UI");

  const dataIso = "2026-06-15";
  const turma = await seedTurma(request, `E2E Turma Evento ${Date.now()}`);
  await seedDia(request, dataIso);

  const observer = observeApiRequests(page);
  try {
    await loginViaUi(page);
    await page.goto(`/dias/${dataIso}`);
    await expect(page.getByTestId(testIds.pageDiaDetalhe)).toBeVisible();

    await page.getByTestId(testIds.selectEventoTipo).selectOption("AULA");
    await page.getByTestId(testIds.selectEventoTurma).selectOption(String(turma.id));
    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/dias/${dataIso}/eventos`) &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    await page.getByTestId(testIds.buttonCriarEvento).click();
    await createResponse;

    await expect(page.getByText(turma.nome).first()).toBeVisible();
    expect(
      observer.apiUrls.some((url) => url.includes(`/api/dias/${dataIso}/eventos`)),
    ).toBeTruthy();
    expectOnlyApiDataCalls(observer);
  } finally {
    observer.stop();
  }
});
