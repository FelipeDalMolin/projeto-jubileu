// src/components/dias/DiaCard.tsx
import { Link } from "react-router-dom";
import type { DiaResumo } from "../../types/domain";

type Props = {
  dia: DiaResumo;
};

export default function DiaCard({ dia }: Props) {
  return (
    <Link
      to={`/dias/${dia.dataIso}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <strong>{dia.dataIso}</strong>

          {dia.treinoCancelado && (
            <span
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 4,
                background: "#fed7d7",
                color: "#c53030",
              }}
            >
              X Treino cancelado
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            margin: "4px 0",
          }}
        >
          {dia.turmas.map((turma) => (
            <span
              key={turma}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 999,
                background: "#e2e8f0",
                color: "#0f172a",
              }}
            >
              {turma}
            </span>
          ))}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#475569",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span>Equipes: {dia.totalEquipes}</span>
          <span>Partidas: {dia.totalPartidas}</span>
          <span>Gols: {dia.totalGols}</span>
          <span>Chiliques: {dia.totalChiliques}</span>
        </div>
      </div>
    </Link>
  );
}
