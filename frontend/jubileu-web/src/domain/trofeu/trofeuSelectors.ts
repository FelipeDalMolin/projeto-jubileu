import { addDays, parseISO, isAfter, isEqual } from "date-fns";
import type { RegistroAula } from "./trofeuTypes";

export function filtrarPorPeriodo(
  registros: RegistroAula[],
  periodoDias: number,
  hoje: Date = new Date(),
): RegistroAula[] {
  const limite = addDays(hoje, -periodoDias);
  return registros.filter((r) => {
    const data = parseISO(r.dataIso);
    return isAfter(data, limite) || isEqual(data, limite);
  });
}

export function filtrarPorTurma(registros: RegistroAula[], turmaId?: number | null): RegistroAula[] {
  if (turmaId === undefined || turmaId === null) return registros;
  return registros.filter((r) => r.turmaId === turmaId);
}

export function totalAulas(registros: RegistroAula[]): number {
  return registros.length;
}
