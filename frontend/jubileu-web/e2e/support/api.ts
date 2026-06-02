import type { APIRequestContext, APIResponse } from "@playwright/test";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

export type SeedJogador = {
  id: number;
  nome: string;
  apelido?: string | null;
  status: string;
};

export type SeedTurma = {
  id: number;
  nome: string;
};

export type SeedEvento = {
  id: number;
  tipo: string;
  status: string;
};

function apiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

export async function apiHealth(request: APIRequestContext): Promise<APIResponse | null> {
  try {
    const response = await request.get(apiPath("/api/health"), { timeout: 5_000 });
    return response;
  } catch {
    return null;
  }
}

export async function isApiHealthy(request: APIRequestContext): Promise<boolean> {
  const response = await apiHealth(request);
  return Boolean(response?.ok());
}

export async function seedJogador(
  request: APIRequestContext,
  nome = `E2E Jogador ${Date.now()}`,
): Promise<SeedJogador> {
  const response = await request.post(apiPath("/api/jogadores/"), {
    data: {
      nome,
      apelido: "E2E",
      status: "ativo",
    },
  });
  if (!response.ok()) {
    throw new Error(`seedJogador failed: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function seedTurma(
  request: APIRequestContext,
  nome = `E2E Turma ${Date.now()}`,
): Promise<SeedTurma> {
  const response = await request.post(apiPath("/api/turmas/"), {
    data: { nome },
  });
  if (!response.ok()) {
    throw new Error(`seedTurma failed: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function seedVinculoTurmaJogador(
  request: APIRequestContext,
  turmaId: number,
  jogadorId: number,
): Promise<void> {
  const response = await request.post(apiPath(`/api/turmas/${turmaId}/jogadores`), {
    data: { jogador_id: jogadorId },
  });
  if (!response.ok()) {
    throw new Error(`seedVinculoTurmaJogador failed: ${response.status()} ${await response.text()}`);
  }
}

export async function seedDia(request: APIRequestContext, dataIso: string): Promise<unknown> {
  const response = await request.get(apiPath(`/api/dias/${dataIso}`));
  if (!response.ok()) {
    throw new Error(`seedDia failed: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function seedEvento(
  request: APIRequestContext,
  dataIso: string,
  turmaId: number,
): Promise<SeedEvento> {
  const response = await request.post(apiPath(`/api/dias/${dataIso}/eventos`), {
    data: {
      turma_id: turmaId,
      tipo: "AULA",
      horario_inicio: "19:00",
      horario_fim: "20:00",
      status: "PLANEJADO",
    },
  });
  if (!response.ok()) {
    throw new Error(`seedEvento failed: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}
