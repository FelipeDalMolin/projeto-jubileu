import { useMemo, useState } from "react";

type StatusJogador = "ativo" | "temporariamente_afastado" | "desligado";

type Jogador = {
  id: number;
  nome: string;
  apelido?: string;
  turma: string;
  posicao: string;
  status: StatusJogador;
  gols?: number;
  chiliques?: number;
};

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

function statusLabel(status: StatusJogador) {
  switch (status) {
    case "ativo":
      return "Ativo";
    case "temporariamente_afastado":
      return "Afastado";
    case "desligado":
      return "Desligado";
    default:
      return status;
  }
}

function tagColor(status: StatusJogador) {
  if (status === "ativo") return "#dcfce7";
  if (status === "temporariamente_afastado") return "#fef9c3";
  return "#fee2e2";
}

export default function JogadoresPage() {
  const [busca, setBusca] = useState("");
  const [turma, setTurma] = useState("Todas");
  const [status, setStatus] = useState<StatusJogador | "Todos">("Todos");

  const jogadoresFiltrados = useMemo(() => {
    return MOCK_JOGADORES.filter((j) => {
      const nomeMatch =
        j.nome.toLowerCase().includes(busca.toLowerCase()) ||
        j.apelido?.toLowerCase().includes(busca.toLowerCase());

      const turmaMatch = turma === "Todas" || j.turma === turma;
      const statusMatch = status === "Todos" || j.status === status;

      return nomeMatch && turmaMatch && statusMatch;
    });
  }, [busca, turma, status]);

  const totais = useMemo(() => {
    const ativos = MOCK_JOGADORES.filter((j) => j.status === "ativo").length;
    const afastados = MOCK_JOGADORES.filter(
      (j) => j.status === "temporariamente_afastado"
    ).length;
    const desligados = MOCK_JOGADORES.filter((j) => j.status === "desligado").length;

    return { ativos, afastados, desligados, total: MOCK_JOGADORES.length };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>Gestão</p>
          <h2 style={{ margin: 0 }}>Jogadores</h2>
        </div>
        <button style={{ background: "#22c55e", borderColor: "#bbf7d0", color: "#0f172a" }}>
          + Novo jogador
        </button>
      </div>

      {/* Cards de resumo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[{ label: "Total", valor: totais.total }, { label: "Ativos", valor: totais.ativos }, { label: "Afastados", valor: totais.afastados }, { label: "Desligados", valor: totais.desligados }].map(
          (item) => (
            <div
              key={item.label}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{item.label}</p>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                {item.valor}
              </div>
            </div>
          )
        )}
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 220 }}>
          <label style={{ fontSize: 12, color: "#475569" }}>Buscar por nome</label>
          <input
            type="text"
            placeholder="Nome ou apelido"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: 160 }}>
          <label style={{ fontSize: 12, color: "#475569" }}>Turma</label>
          <select value={turma} onChange={(e) => setTurma(e.target.value)}>
            <option>Todas</option>
            <option>Sub-11</option>
            <option>Sub-13</option>
            <option>Adulto</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: 200 }}>
          <label style={{ fontSize: 12, color: "#475569" }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusJogador | "Todos")}
          >
            <option value="Todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="temporariamente_afastado">Afastado</option>
            <option value="desligado">Desligado</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              {["Jogador", "Turma", "Posição", "Status", "Gols", "Chiliques"].map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderBottom: "1px solid #e2e8f0",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {jogadoresFiltrados.map((j) => (
              <tr key={j.id}>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 600 }}>{j.nome}</div>
                  {j.apelido && (
                    <div style={{ fontSize: 12, color: "#64748b" }}>({j.apelido})</div>
                  )}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                  {j.turma}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                  {j.posicao}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                  <span
                    style={{
                      background: tagColor(j.status),
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                    }}
                  >
                    {statusLabel(j.status)}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                  {j.gols ?? 0}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                  {j.chiliques ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {jogadoresFiltrados.length === 0 && (
          <div style={{ padding: 16, color: "#475569" }}>
            Nenhum jogador encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}
