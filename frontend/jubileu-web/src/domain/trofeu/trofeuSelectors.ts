import { addDays, parseISO, isAfter, isEqual } from "date-fns";
import type { RegistroEvento } from "./trofeuTypes";

export function filtrarPorPeriodo(
  registros: RegistroEvento[],
  periodoDias: number,
  hoje: Date = new Date(),
): RegistroEvento[] {
  const limite = addDays(hoje, -periodoDias);
  return registros.filter((r) => {
    const data = parseISO(r.dataIso);
    return isAfter(data, limite) || isEqual(data, limite);
  });
}

export function filtrarPorTurma(registros: RegistroEvento[], turmaId?: number | null): RegistroEvento[] {
  if (turmaId === undefined || turmaId === null) return registros;
  return registros.filter((r) => r.turmaId === turmaId);
}

export function totalEventos(registros: RegistroEvento[]): number {
  return registros.length;
}
