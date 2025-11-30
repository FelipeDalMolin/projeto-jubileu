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
    <div className="page-container" style={{ display: "grid", gap: 16 }}>
      <div className="page-header">
        <h2 className="page-header-title">Jogadores</h2>
      </div>

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
        className="card"
        style={{ display: "flex", flexWrap: "wrap", gap: 12, background: "#f8fafc" }}
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
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Turma</th>
                <th>Posição</th>
                <th>Status</th>
                <th>Gols</th>
                <th>Chiliques</th>
              </tr>
            </thead>
            <tbody>
              {jogadoresFiltrados.map((jogador) => (
                <tr key={jogador.id}>
                  <td>
                    {jogador.nome}
                    {jogador.apelido ? ` (${jogador.apelido})` : ""}
                  </td>
                  <td>{jogador.turma}</td>
                  <td>{jogador.posicao}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {jogador.status.replace(/_/g, " ")}
                  </td>
                  <td>{jogador.gols ?? 0}</td>
                  <td>{jogador.chiliques ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResumoCard(props: { titulo: string; valor: number }) {
  return (
    <div className="card">
      <p className="card-subtitle" style={{ margin: 0 }}>{props.titulo}</p>
      <h3 className="card-title" style={{ margin: 0 }}>{props.valor}</h3>
    </div>
  );
}
