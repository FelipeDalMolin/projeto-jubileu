import { apiFetch } from "../lib/apiClient";

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

async function executarAcao(
  eventoId: number,
  action: "start" | "end",
) {
  const resp = await apiFetch(
    buildUrl(`/api/eventos/${eventoId}/${action}`),
    {
      method: "POST",
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao ${action === "start" ? "iniciar" : "encerrar"} evento: ${resp.status} ${await safeText(resp)}`,
    );
  }
}

export async function iniciarEvento(eventoId: number) {
  await executarAcao(eventoId, "start");
}

export async function encerrarEvento(eventoId: number) {
  await executarAcao(eventoId, "end");
}
