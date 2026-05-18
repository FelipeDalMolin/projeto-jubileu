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
  dataIso: string,
  eventoId: number,
  action: "start" | "finish",
) {
  const resp = await fetch(
    buildUrl(`/dias/${dataIso}/eventos/${eventoId}/${action}`),
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

export async function iniciarEvento(dataIso: string, eventoId: number) {
  await executarAcao(dataIso, eventoId, "start");
}

export async function encerrarEvento(dataIso: string, eventoId: number) {
  await executarAcao(dataIso, eventoId, "finish");
}
