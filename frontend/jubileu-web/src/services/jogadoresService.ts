// src/services/jogadoresService.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type JogadorStatus = "ativo" | "inativo" | "lesionado" | "afastado";

export type JogadorDTO = {
  id: number;
  nome: string;
  apelido?: string | null;
  status: JogadorStatus;
};

export type CriarJogadorInput = {
  nome: string;
  apelido?: string | null;
  status?: string; // aceita "Ativo", "ATIVO", etc
};

export type AtualizarJogadorInput = {
  nome?: string;
  apelido?: string | null;
  status?: string;
};

function url(path: string) {
  return `${API_BASE_URL}${path}`;
}

function normalizarStatus(v?: string | null): JogadorStatus {
  const raw = (v ?? "").trim().toLowerCase();

  // aceita variações do UI
  if (raw === "ativo" || raw === "atv") return "ativo";
  if (raw === "inativo" || raw === "inat") return "inativo";
  if (raw === "lesionado" || raw === "lesao" || raw === "lesão") return "lesionado";
  if (raw === "afastado") return "afastado";

  // fallback seguro
  return "ativo";
}

function limparCriarPayload(data: CriarJogadorInput) {
  return {
    nome: data.nome.trim(),
    apelido: data.apelido?.trim() ? data.apelido.trim() : null,
    status: normalizarStatus(data.status),
  };
}

function limparAtualizarPayload(data: AtualizarJogadorInput) {
  return {
    ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
    ...(data.apelido !== undefined
      ? { apelido: data.apelido?.trim() ? data.apelido.trim() : null }
      : {}),
    ...(data.status !== undefined ? { status: normalizarStatus(data.status) } : {}),
  };
}

export async function listarJogadores(): Promise<JogadorDTO[]> {
  const resp = await fetch(url(`/api/jogadores/`));
  if (!resp.ok) throw new Error(`Erro ao listar jogadores: ${resp.status}`);
  return resp.json();
}

export async function criarJogador(data: CriarJogadorInput): Promise<JogadorDTO> {
  const payload = limparCriarPayload(data);

  const resp = await fetch(url(`/api/jogadores/`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Erro ao criar jogador: ${resp.status} ${txt}`);
  }

  return resp.json();
}

export async function atualizarJogador(
  id: number,
  data: AtualizarJogadorInput
): Promise<JogadorDTO> {
  const payload = limparAtualizarPayload(data);

  const resp = await fetch(url(`/api/jogadores/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Erro ao atualizar jogador: ${resp.status} ${txt}`);
  }

  return resp.json();
}

export async function deletarJogador(id: number): Promise<void> {
  const resp = await fetch(url(`/api/jogadores/${id}`), { method: "DELETE" });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Erro ao deletar jogador: ${resp.status} ${txt}`);
  }
}
