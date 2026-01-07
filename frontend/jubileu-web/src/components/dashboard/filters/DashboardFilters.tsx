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
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body row g-2 g-md-3">
        <div className="col-12 col-md-4">
          <label className="form-label text-muted small mb-1">Período</label>
          <div className="btn-group w-100" role="group" aria-label="Filtro de período">
            {[30, 90, 365].map((p) => (
              <button
                key={p}
                type="button"
                className={`btn btn-sm ${period === p ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => onChangePeriod(p)}
              >
                {p} dias
              </button>
            ))}
          </div>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label text-muted small mb-1">Turma</label>
          <select
            className="form-select"
            value={turma}
            onChange={(e) => onChangeTurma(e.target.value)}
          >
            <option value="todas">Todas as turmas</option>
            {turmasDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label text-muted small mb-1">Busca</label>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nome ou detalhe..."
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
