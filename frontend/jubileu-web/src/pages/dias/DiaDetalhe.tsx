import { useParams } from "react-router-dom";
import { useState } from "react";
import Tabs from "../../components/layout/Tabs";
import DiaEquipesTab from "./DiaEquipesTab";
import DiaPartidasTab from "./DiaPartidasTab";

export default function DiaDetalhe() {
  const { id } = useParams();
  const [treinoCancelado, setTreinoCancelado] = useState(false);

  function toggleTreinoCancelado() {
    setTreinoCancelado((prev) => !prev);
    // depois vamos enviar para o backend
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>Dia {id}</h2>

          {treinoCancelado && (
            <span
              style={{
                fontSize: 12,
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

        <button onClick={toggleTreinoCancelado}>
          {treinoCancelado
            ? "Reativar treino"
            : "Marcar treino como cancelado (X)"}
        </button>
      </div>

      {/* 🔒 Quando treino cancelado, bloqueia abas */}
      {treinoCancelado ? (
        <div
          style={{
            padding: 18,
            borderRadius: 8,
            background: "#fff5f5",
            border: "1px solid #fecaca",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Treino cancelado</h3>
          <p style={{ fontSize: 14, lineHeight: "20px" }}>
            Este treino foi marcado como <strong>cancelado (X)</strong>.
            <br />
            Por isso, configurações de equipes, partidas e súmula estão
            desabilitadas.
          </p>
          <p style={{ fontSize: 13, color: "#555" }}>
            Caso o treino tenha acontecido, clique em{" "}
            <strong>“Reativar treino”</strong> para liberar as edições.
          </p>
        </div>
      ) : (
        <Tabs
          tabs={[
            {
              id: "equipes",
              titulo: "Equipes",
              conteudo: <DiaEquipesTab />,
            },
            {
              id: "partidas",
              titulo: "Partidas",
              conteudo: <DiaPartidasTab />,
            },
            {
              id: "sumula",
              titulo: "Súmula",
              conteudo: <p>Aqui depois vamos gerar a súmula automática.</p>,
            },
          ]}
        />
      )}
    </div>
  );
}
