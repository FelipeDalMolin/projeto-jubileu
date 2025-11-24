const cards = [
  { titulo: "Dias registrados", valor: 12, destaque: "+2 vs semana passada" },
  { titulo: "Gols anotados", valor: 87, destaque: "Média 7,2 por jogo" },
  { titulo: "Chiliques", valor: 9, destaque: "-3 comparado à última semana" },
  { titulo: "Jogadores ativos", valor: 32, destaque: "Inclui 4 novatos" },
];

const proximosEventos = [
  { data: "15/12", descricao: "Treino especial Sub-11" },
  { data: "18/12", descricao: "Amistoso Adulto x Veteranos" },
  { data: "20/12", descricao: "Avaliação técnica Sub-13" },
];

export default function DashboardsPage() {
  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>Visão geral</p>
        <h2 style={{ margin: 0 }}>Painéis e indicadores</h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.titulo}
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 2px 4px rgba(15, 23, 42, 0.04)",
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{card.titulo}</p>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
              {card.valor}
            </div>
            <div style={{ fontSize: 12, color: "#0ea5e9", marginTop: 6 }}>
              {card.destaque}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 12,
          alignItems: "start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>Chiliques por turma</h3>
          <p style={{ marginTop: 0, color: "#475569", fontSize: 14 }}>
            Gráfico placeholder: em breve ligaremos aos dados reais do backend.
          </p>
          <div
            style={{
              height: 180,
              border: "1px dashed #cbd5e1",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
            }}
          >
            (gráfico)
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Próximos eventos</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {proximosEventos.map((ev) => (
              <li
                key={ev.descricao}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    background: "#e0f2fe",
                    color: "#0f172a",
                    fontWeight: 700,
                    padding: "8px 10px",
                    borderRadius: 8,
                    minWidth: 62,
                    textAlign: "center",
                  }}
                >
                  {ev.data}
                </div>
                <div style={{ color: "#0f172a", fontWeight: 600 }}>{ev.descricao}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
