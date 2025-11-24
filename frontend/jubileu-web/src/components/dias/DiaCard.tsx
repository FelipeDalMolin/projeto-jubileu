import { Link } from "react-router-dom";

export type DiaResumo = {
  id: number;
  data: string;
  turma: string;
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

        <p style={{ margin: "4px 0" }}>{dia.turma}</p>

        <p style={{ fontSize: 12, margin: "4px 0" }}>
          {dia.totalEquipes} equipes • {dia.totalPartidas} partidas
        </p>

        <p style={{ fontSize: 12, margin: "4px 0" }}>
          Gols: {dia.totalGols} • Chiliques: {dia.totalChiliques}
        </p>
      </div>
    </Link>
  );
}
