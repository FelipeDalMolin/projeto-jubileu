import type { WorkspaceEvento, WorkspaceEventoResponse } from "../types/workspaceEvento";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function safeText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

export async function obterWorkspaceEvento(
  dataIso: string,
  eventoId: string | number,
  sinceVersion?: number,
): Promise<WorkspaceEventoResponse> {
  const params = new URLSearchParams();

  if (sinceVersion !== undefined) {
    params.set("since_version", String(sinceVersion));
  }

  const query = params.toString();

  const resp = await fetch(
    buildUrl(
      `/api/dias/${dataIso}/eventos/${eventoId}/workspace${query ? `?${query}` : ""}`,
    ),
  );

  if (resp.status === 204) {
    return { status: 204 };
  }

  if (!resp.ok) {
    throw new Error(
      `Erro ao obter workspace da evento: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data: WorkspaceEvento = await resp.json();
  if (typeof data?.meta?.version !== "number") {
    throw new Error("Workspace da evento invalido: campo 'meta.version' ausente");
  }

  return { status: 200, data };
}
