import { expect, test } from "@playwright/test";
import { loginViaUi } from "./support/auth";
import { observeApiRequests, expectOnlyApiDataCalls } from "./support/network";
import { testIds } from "./support/testIds";

test("E2E-UC10: dashboard renderiza indicadores ou estado de erro operacional", async ({ page }) => {
  const observer = observeApiRequests(page);
  try {
    await loginViaUi(page);
    await page.getByTestId(testIds.navDashboard).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const dashboard = page.getByTestId(testIds.dashboardIndicadores);
    const operationalError = page.getByText("Nao foi possivel carregar o dashboard");
    await expect(dashboard.or(operationalError)).toBeVisible();

    expectOnlyApiDataCalls(observer);
  } finally {
    observer.stop();
  }
});
