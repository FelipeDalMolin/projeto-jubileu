import { expect, test as base, type APIRequestContext } from "@playwright/test";

const operatorHeaders = { "X-User-Id": "u-admin", "X-Role": "admin" };

const test = base.extend<{ request: APIRequestContext }>({
  request: async ({ playwright }, provide) => {
    const context = await playwright.request.newContext({
      extraHTTPHeaders: operatorHeaders,
    });
    await provide(context);
    await context.dispose();
  },
});

export { expect, test };
export type { APIRequestContext };
