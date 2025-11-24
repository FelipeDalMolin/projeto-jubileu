type FiltrosDias = {
  dataInicio?: string;
  dataFim?: string;
  turma?: string;
};

type Props = {
  filtros: FiltrosDias;
  onChange: (filtros: FiltrosDias) => void;
  onReset: () => void;
};

export default function SidebarFiltrosDias({ filtros, onChange, onReset }: Props) {
  return (
    <aside
      style={{
        width: 260,
        borderRight: "1px solid #ddd",
        padding: 16,
      }}
    >
      <h3>Filtros</h3>

      <div style={{ marginTop: 16 }}>
        <label>Data inicial</label>
        <input
          type="date"
          style={{ width: "100%" }}
          value={filtros.dataInicio || ""}
          onChange={(e) => onChange({ ...filtros, dataInicio: e.target.value })}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Data final</label>
        <input
          type="date"
          style={{ width: "100%" }}
          value={filtros.dataFim || ""}
          onChange={(e) => onChange({ ...filtros, dataFim: e.target.value })}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Turma</label>
        <input
          type="text"
          placeholder="Sub-11..."
          style={{ width: "100%" }}
          value={filtros.turma || ""}
          onChange={(e) => onChange({ ...filtros, turma: e.target.value })}
        />
      </div>

      <button
        style={{ marginTop: 16, width: "100%" }}
        onClick={onReset}
      >
        Limpar filtros
      </button>
    </aside>
  );
}
