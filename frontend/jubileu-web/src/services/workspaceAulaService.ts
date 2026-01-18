import type { WorkspaceAula, WorkspaceAulaResponse } from "../types/workspaceAula";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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

export async function obterWorkspaceAula(
  dataIso: string,
  aulaId: string | number,
  sinceVersion?: number,
): Promise<WorkspaceAulaResponse> {
  const params = new URLSearchParams();

  if (sinceVersion !== undefined) {
    params.set("since_version", String(sinceVersion));
  }

  const query = params.toString();

  const resp = await fetch(
    buildUrl(
      `/dias/${dataIso}/aulas/${aulaId}/workspace${query ? `?${query}` : ""}`,
    ),
  );

  if (resp.status === 204) {
    return { status: 204 };
  }

  if (!resp.ok) {
    throw new Error(
      `Erro ao obter workspace da aula: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data: WorkspaceAula = await resp.json();
  if (typeof data?.meta?.version !== "number") {
    throw new Error("Workspace da aula invalido: campo 'meta.version' ausente");
  }

  return { status: 200, data };
}
