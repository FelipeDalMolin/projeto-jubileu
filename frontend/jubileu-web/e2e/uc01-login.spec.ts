import { expect, test } from "@playwright/test";
import { loginViaUi } from "./support/auth";
import { testIds } from "./support/testIds";

test("E2E-UC01: login pela UI cria sessao e navega para calendario", async ({ page }) => {
  await loginViaUi(page);
  await expect(page.getByTestId(testIds.pageCalendario)).toBeVisible();
  await expect(page.getByTestId(testIds.navSessao)).toBeVisible();
});
