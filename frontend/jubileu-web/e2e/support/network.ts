import { expect, type Page, type Request, type Response } from "@playwright/test";

type ObservedApiResponse = {
  url: string;
  status: number;
  requestId: string | null;
};

export type NetworkObserver = {
  apiUrls: string[];
  apiResponses: ObservedApiResponse[];
  stop: () => void;
};

function isAssetOrDocument(url: string): boolean {
  return (
    url.includes("/assets/") ||
    url.endsWith(".js") ||
    url.endsWith(".css") ||
    url.endsWith(".svg") ||
    url.endsWith(".ico")
  );
}

export function observeApiRequests(page: Page): NetworkObserver {
  const apiUrls: string[] = [];
  const apiResponses: ObservedApiResponse[] = [];

  const onRequest = (request: Request) => {
    const url = request.url();
    if (url.includes("/api/api")) {
      throw new Error(`Detected duplicated API prefix: ${url}`);
    }
    if (url.includes("/api/")) {
      apiUrls.push(url);
    }
  };

  const onResponse = async (response: Response) => {
    const url = response.url();
    if (url.includes("/api/api")) {
      throw new Error(`Detected duplicated API prefix in response: ${url}`);
    }
    if (!url.includes("/api/") || isAssetOrDocument(url)) return;

    apiResponses.push({
      url,
      status: response.status(),
      requestId: response.headers()["x-request-id"] ?? null,
    });
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  return {
    apiUrls,
    apiResponses,
    stop: () => {
      page.off("request", onRequest);
      page.off("response", onResponse);
    },
  };
}

export function expectOnlyApiDataCalls(observer: NetworkObserver): void {
  for (const url of observer.apiUrls) {
    expect(url).toContain("/api/");
    expect(url).not.toContain("/api/api");
  }
}

export function expectAtLeastOneRequestId(observer: NetworkObserver): void {
  const observed = observer.apiResponses.some((response) => Boolean(response.requestId));
  expect(observed, "expected at least one API response with X-Request-ID").toBeTruthy();
}
