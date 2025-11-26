// src/pages/JogadoresPage.tsx
import { useMemo, useState } from "react";
import type { Jogador, StatusJogador } from "../../types/domain";

const MOCK_JOGADORES: Jogador[] = [
  {
    id: 1,
    nome: "João Victor",
    apelido: "JVi",
    turma: "Sub-11",
    posicao: "Goleiro",
    status: "ativo",
    gols: 0,
    chiliques: 0,
  },
  {
    id: 2,
    nome: "Pedro Silva",
    turma: "Sub-13",
    posicao: "Atacante",
    status: "ativo",
    gols: 12,
    chiliques: 1,
  },
  {
    id: 3,
    nome: "Carlos Santos",
    apelido: "Carlinhos",
    turma: "Adulto",
    posicao: "Zagueiro",
    status: "temporariamente_afastado",
    gols: 3,
    chiliques: 0,
  },
  {
    id: 4,
    nome: "Lucas Lima",
    turma: "Adulto",
    posicao: "Ala",
    status: "ativo",
    gols: 9,
    chiliques: 2,
  },
  {
    id: 5,
    nome: "Matheus Rocha",
    turma: "Sub-11",
    posicao: "Pivô",
    status: "desligado",
    gols: 1,
    chiliques: 0,
  },
];

type FiltrosJogadores = {
  nome?: string;
  turma?: string;
  status?: StatusJogador | "todos";
};

export default function JogadoresPage() {
  const [filtros, setFiltros] = useState<FiltrosJogadores>({
    status: "todos",
  });

  const jogadoresFiltrados = useMemo(() => {
    return MOCK_JOGADORES.filter((jogador) => {
      if (filtros.nome) {
        const busca = filtros.nome.toLowerCase();
        if (
          !jogador.nome.toLowerCase().includes(busca) &&
          !(jogador.apelido || "").toLowerCase().includes(busca)
        ) {
          return false;
        }
      }

      if (filtros.turma) {
        if (
          !jogador.turma ||
          !jogador.turma.toLowerCase().includes(filtros.turma.toLowerCase())
        ) {
          return false;
        }
      }

      if (filtros.status && filtros.status !== "todos") {
        if (jogador.status !== filtros.status) return false;
      }

      return true;
    });
  }, [filtros]);

  const total = MOCK_JOGADORES.length;
  const ativos = MOCK_JOGADORES.filter((j) => j.status === "ativo").length;
  const afastados = MOCK_JOGADORES.filter(
    (j) => j.status === "temporariamente_afastado"
  ).length;
  const desligados = MOCK_JOGADORES.filter(
    (j) => j.status === "desligado"
  ).length;

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <h2>Jogadores</h2>

      {/* Resumo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        <ResumoCard titulo="Total" valor={total} />
        <ResumoCard titulo="Ativos" valor={ativos} />
        <ResumoCard titulo="Afastados" valor={afastados} />
        <ResumoCard titulo="Desligados" valor={desligados} />
      </div>

      {/* Filtros */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 12,
          background: "#f8fafc",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Nome / apelido</label>
          <input
            type="text"
            value={filtros.nome || ""}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                nome: e.target.value || undefined,
              }))
            }
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Turma</label>
          <input
            type="text"
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
          <label style={{ fontSize: 12 }}>Status</label>
          <select
            value={filtros.status || "todos"}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                status: e.target.value as FiltrosJogadores["status"],
              }))
            }
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="temporariamente_afastado">Afastado</option>
            <option value="desligado">Desligado</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 12,
          background: "#fff",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Nome</th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Turma</th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Posição</th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Gols</th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Chiliques</th>
            </tr>
          </thead>
          <tbody>
            {jogadoresFiltrados.map((jogador) => (
              <tr key={jogador.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "8px 4px" }}>
                  {jogador.nome}
                  {jogador.apelido ? ` (${jogador.apelido})` : ""}
                </td>
                <td style={{ padding: "8px 4px" }}>{jogador.turma}</td>
                <td style={{ padding: "8px 4px" }}>{jogador.posicao}</td>
                <td style={{ padding: "8px 4px", textTransform: "capitalize" }}>
                  {jogador.status.replace(/_/g, " ")}
                </td>
                <td style={{ padding: "8px 4px" }}>{jogador.gols ?? 0}</td>
                <td style={{ padding: "8px 4px" }}>{jogador.chiliques ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResumoCard(props: { titulo: string; valor: number }) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        padding: 12,
        background: "#fff",
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{props.titulo}</p>
      <h3 style={{ margin: 0 }}>{props.valor}</h3>
    </div>
  );
}
