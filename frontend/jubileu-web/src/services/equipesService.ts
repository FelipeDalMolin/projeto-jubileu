// src/services/equipesService.ts
import type { EstadoEquipesDia } from "../types/equipes";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export async function obterEstadoEquipes(diaId: string): Promise<EstadoEquipesDia> {
  const resp = await fetch(`${API_BASE}/dias/${diaId}/equipes`);
  if (!resp.ok) throw new Error("Erro ao obter equipes do dia");
  return resp.json();
}

export async function salvarEstadoEquipes(
  diaId: string,
  estado: EstadoEquipesDia
): Promise<EstadoEquipesDia> {
  const resp = await fetch(`${API_BASE}/dias/${diaId}/equipes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(estado),
  });
  if (!resp.ok) throw new Error("Erro ao salvar equipes do dia");
  return resp.json();
}
