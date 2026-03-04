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

async function executarAcao(
  dataIso: string,
  aulaId: number,
  action: "start" | "finish",
) {
  const resp = await fetch(
    buildUrl(`/dias/${dataIso}/aulas/${aulaId}/${action}`),
    {
      method: "POST",
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao ${action === "start" ? "iniciar" : "encerrar"} aula: ${resp.status} ${await safeText(resp)}`,
    );
  }
}

export async function iniciarAula(dataIso: string, aulaId: number) {
  await executarAcao(dataIso, aulaId, "start");
}

export async function encerrarAula(dataIso: string, aulaId: number) {
  await executarAcao(dataIso, aulaId, "finish");
}
