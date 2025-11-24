import { useState } from "react";
import DiaCard, { type DiaResumo } from "../../components/dias/DiaCard";

type FiltrosDias = {
  mesReferencia?: string; // formato "YYYY-MM"
  turma?: string;
  somenteTreinoCancelado?: boolean;
};

// MOCK – depois vamos buscar da API
const MOCK_DIAS: DiaResumo[] = [
  {
    id: 1,
    data: "2025-11-20",
    turma: "Sub-11",
    totalEquipes: 3,
    totalPartidas: 4,
    totalGols: 18,
    totalChiliques: 2,
    treinoCancelado: false,
  },
  {
    id: 2,
    data: "2025-11-22",
    turma: "Adulto",
    totalEquipes: 4,
    totalPartidas: 6,
    totalGols: 25,
    totalChiliques: 5,
    treinoCancelado: true,
  },
];

function filtrarDias(dias: DiaResumo[], filtros: FiltrosDias): DiaResumo[] {
  return dias.filter((d) => {
    // filtro por mês (calendário)
    if (filtros.mesReferencia) {
      const mesDoDia = d.data.slice(0, 7); // "YYYY-MM"
      if (mesDoDia !== filtros.mesReferencia) return false;
    }

    // filtro por turma
    if (
      filtros.turma &&
      !d.turma.toLowerCase().includes(filtros.turma.toLowerCase())
    ) {
      return false;
    }

    // filtro por treino cancelado
    if (filtros.somenteTreinoCancelado && !d.treinoCancelado) {
      return false;
    }

    return true;
  });
}

export default function DiaLista() {
  const [filtros, setFiltros] = useState<FiltrosDias>({});
  const diasFiltrados = filtrarDias(MOCK_DIAS, filtros);

  function limparFiltros() {
    setFiltros({});
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Dias de Jogo</h2>

      {/* Barra de filtros no topo */}
      <div
        style={{
          marginTop: 12,
          marginBottom: 16,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Calendário (mês)</label>
          <input
            type="month"
            value={filtros.mesReferencia || ""}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                mesReferencia: e.target.value || undefined,
              }))
            }
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Turma</label>
          <input
            type="text"
            placeholder="Sub-11, Adulto..."
            value={filtros.turma || ""}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                turma: e.target.value || undefined,
              }))
            }
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Só treino cancelado (X)</label>
          <input
            type="checkbox"
            checked={filtros.somenteTreinoCancelado || false}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                somenteTreinoCancelado: e.target.checked || undefined,
              }))
            }
          />
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={limparFiltros}>Limpar filtros</button>
          <button>+ Novo dia</button>
        </div>
      </div>

      {/* Grid de cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {diasFiltrados.map((dia) => (
          <DiaCard key={dia.id} dia={dia} />
        ))}
      </div>
    </div>
  );
}
