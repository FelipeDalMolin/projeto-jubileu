import { expect, type Page } from "@playwright/test";
import { testIds } from "./testIds";

export async function loginViaUi(
  page: Page,
  username = "admin",
  password = "admin123",
): Promise<void> {
  await page.goto("/login");
  await expect(page.getByTestId(testIds.pageLogin)).toBeVisible();
  await page.getByTestId(testIds.inputLoginUsuario).fill(username);
  await page.getByTestId(testIds.inputLoginSenha).fill(password);
  await page.getByTestId(testIds.buttonLogin).click();
  await expect(page).toHaveURL(/\/dias/);
}
