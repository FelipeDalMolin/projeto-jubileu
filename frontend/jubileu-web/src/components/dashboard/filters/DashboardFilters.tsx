type Props = {
  period: number;
  turma: string;
  search: string;
  turmasDisponiveis: string[];
  onChangePeriod: (value: number) => void;
  onChangeTurma: (value: string) => void;
  onChangeSearch: (value: string) => void;
};

export default function DashboardFilters({
  period,
  turma,
  search,
  turmasDisponiveis,
  onChangePeriod,
  onChangeTurma,
  onChangeSearch,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label="Filtros do dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-slate-700">Período</legend>
          <div className="grid grid-cols-3 rounded-md border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Filtro de período">
            {[30, 90, 365].map((p) => (
              <button
                key={p}
                type="button"
                className={cn(
                  "h-8 rounded px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-sm",
                  period === p ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950",
                )}
                aria-pressed={period === p}
                onClick={() => onChangePeriod(p)}
              >
                {p} dias
              </button>
            ))}
          </div>
        </fieldset>

        <SelectField
            label="Turma"
            value={turma}
            onChange={(e) => onChangeTurma(e.target.value)}
          >
            <option value="todas">Todas as turmas</option>
            {turmasDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </SelectField>

        <Field
            label="Busca"
            type="text"
            placeholder="Buscar por nome ou detalhe..."
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
        />
      </div>
    </section>
  );
}
import { cn } from "../../../lib/utils";
import { Field, SelectField } from "../../ui/form";
