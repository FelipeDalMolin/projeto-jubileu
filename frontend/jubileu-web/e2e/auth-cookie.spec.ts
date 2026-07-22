import { expect, test } from "@playwright/test";

test("DEV-43: cookie HttpOnly persiste sessao e logout remove acesso", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByTestId("input-login-usuario").fill("coach");
  await page.getByTestId("input-login-senha").fill("coach123");
  await page.getByTestId("button-login").click();
  await expect(page).toHaveURL(/\/dias$/);

  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === "jubileu_access")?.httpOnly).toBe(true);
  expect(cookies.find((cookie) => cookie.name === "jubileu_refresh")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual({
    local: {},
    session: {},
  });

  const refreshStatuses = await page.evaluate(async () => {
    const csrf = document.cookie
      .split("; ")
      .find((item) => item.startsWith("jubileu_csrf="))
      ?.split("=")[1];
    const refresh = () => fetch("/api/auth/refresh", { method: "POST", headers: { "X-CSRF-Token": decodeURIComponent(csrf ?? "") } });
    return (await Promise.all([refresh(), refresh()])).map((response) => response.status).sort();
  });
  expect(refreshStatuses).toEqual([200, 409]);
  expect((await page.request.get("/api/auth/me")).status()).toBe(200);

  await page.reload();
  await expect(page.getByTestId("nav-sessao")).toBeVisible();
  await context.clearCookies({ name: "jubileu_access" });
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
  await page.goto("/usuario");
  await expect(page).toHaveURL(/\/login$/);
});

test("DEV-21: user nao ve mutacoes e 403 nao renova nem encerra sessao", async ({ page }) => {
  let refreshCalls = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/auth/refresh")) refreshCalls += 1;
  });

  await page.goto("/login");
  await page.getByTestId("input-login-usuario").fill("user");
  await page.getByTestId("input-login-senha").fill("user123");
  await page.getByTestId("button-login").click();
  await expect(page).toHaveURL(/\/dias$/);

  await page.goto("/jogadores");
  await expect(page.getByTestId("page-jogadores")).toBeVisible();
  await expect(page.getByTestId("form-jogador")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Excluir" })).toHaveCount(0);

  const forbiddenStatus = await page.evaluate(async () => {
    const csrf = document.cookie
      .split("; ")
      .find((item) => item.startsWith("jubileu_csrf="))
      ?.split("=")[1];
    return (await fetch("/api/jogadores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": decodeURIComponent(csrf ?? ""),
      },
      body: JSON.stringify({ nome: "Nao autorizado", status: "ativo" }),
    })).status;
  });

  expect(forbiddenStatus).toBe(403);
  expect(refreshCalls).toBe(0);
  expect((await page.request.get("/api/auth/me")).status()).toBe(200);
});
