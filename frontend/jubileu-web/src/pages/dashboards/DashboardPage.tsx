// src/pages/DashboardsPage.tsx

import React from "react";

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
    <div
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>Visão geral</p>
          <h2 style={{ margin: 0 }}>Dashboards</h2>
        </div>
        <button
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: "#0f172a",
            color: "#e5e7eb",
            cursor: "pointer",
          }}
        >
          Exportar resumo
        </button>
      </div>

      {/* Cards de resumo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.titulo}
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              padding: 14,
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              {card.titulo}
            </p>
            <p
              style={{
                margin: "4px 0",
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {card.valor}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#16a34a",
              }}
            >
              {card.destaque}
            </p>
          </div>
        ))}
      </div>

      {/* Linha inferior: eventos + observações */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 16,
        }}
      >
        {/* Próximos eventos */}
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Próximos eventos</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {proximosEventos.map((ev) => (
              <li
                key={ev.data + ev.descricao}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 700,
                    padding: "8px 10px",
                    borderRadius: 8,
                    minWidth: 62,
                    textAlign: "center",
                  }}
                >
                  {ev.data}
                </div>
                <div style={{ color: "#0f172a", fontWeight: 600 }}>
                  {ev.descricao}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Observações / notas futuras */}
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Notas & insights</h3>
          <p style={{ marginTop: 0, color: "#4b5563", fontSize: 14 }}>
            Esta área depois pode trazer gráficos mais avançados:
          </p>
          <ul style={{ marginTop: 4, paddingLeft: 18, color: "#374151" }}>
            <li>Distribuição de gols por jogador / turma.</li>
            <li>Taxa de treinos cancelados por dia da semana.</li>
            <li>Participação média dos jogadores ao longo dos meses.</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
            Por enquanto estes dados são estáticos (mock). Depois vamos integrar com
            o backend/planilha do Jubileu para gerar os dashboards reais.
          </p>
        </div>
      </div>
    </div>
  );
}
