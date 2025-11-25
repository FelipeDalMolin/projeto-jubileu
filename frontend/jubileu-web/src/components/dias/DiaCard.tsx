import { Link } from "react-router-dom";

export type DiaResumo = {
  id: number;
  data: string;
  turmas: string[];
  totalEquipes: number;
  totalPartidas: number;
  totalGols: number;
  totalChiliques: number;
  treinoCancelado?: boolean;
};

type Props = {
  dia: DiaResumo;
};

export default function DiaCard({ dia }: Props) {
  return (
    <Link
      to={`/dias/${dia.id}`}
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
          <strong>{dia.data}</strong>
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

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "4px 0" }}>
          {dia.turmas.map((turma) => (
            <span
              key={turma}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 999,
                background: "#e2e8f0",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
              }}
            >
              {turma}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 12, margin: "4px 0" }}>
          {dia.turmas.length} turmas • {dia.totalEquipes} equipes • {dia.totalPartidas} partidas
        </p>

        <p style={{ fontSize: 12, margin: "4px 0" }}>
          Gols: {dia.totalGols} • Chiliques: {dia.totalChiliques}
        </p>
      </div>
    </Link>
  );
}
