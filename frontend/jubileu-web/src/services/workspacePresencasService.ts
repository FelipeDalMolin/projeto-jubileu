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

export async function confirmarPresencasAula(
  dataIso: string,
  aulaId: string | number,
  presentesIds: number[],
): Promise<{ version?: number }> {
  const resp = await fetch(
    buildUrl(`/dias/${dataIso}/aulas/${aulaId}/confirmar-presencas`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presentes_ids: presentesIds }),
    },
  );

  if (!resp.ok) {
    throw new Error(
      `Erro ao confirmar presencas: ${resp.status} ${await safeText(resp)}`,
    );
  }

  const data = await resp.json();
  return { version: data?.version };
}
