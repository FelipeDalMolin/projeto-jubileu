// src/pages/dias/DiaDetalhe.tsx
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { Aula, Jogador, Turma } from "../../types/domain";
import { MOCK_JOGADORES_TURMAS, MOCK_TURMAS } from "../turmas/MockTurmas";

const MOCK_AULAS: Aula[] = [
  { id: 1, turmaId: 1, dataIso: "2025-11-20", status: "PLANEJADA" },
  { id: 2, turmaId: 3, dataIso: "2025-11-20", status: "PLANEJADA" },
  { id: 3, turmaId: 2, dataIso: "2025-11-22", status: "PLANEJADA" },
];

function formatarData(iso?: string) {
  if (!iso) return "Data";
  const data = new Date(iso);
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DiaDetalhe() {
  const { dataIso } = useParams<{ dataIso: string }>();

  const [treinoCancelado, setTreinoCancelado] = useState(false);
  const [aulas, setAulas] = useState<Aula[]>(MOCK_AULAS);
  const [aulaSelecionadaId, setAulaSelecionadaId] = useState<number | null>(null);

  const aulasDoDia = useMemo(
    () => aulas.filter((aula) => aula.dataIso === dataIso),
    [aulas, dataIso]
  );

  const aulaSelecionadaIdResolvido = useMemo(() => {
    if (aulasDoDia.some((aula) => aula.id === aulaSelecionadaId)) {
      return aulaSelecionadaId;
    }
    return aulasDoDia[0]?.id ?? null;
  }, [aulasDoDia, aulaSelecionadaId]);

  const aulaSelecionada =
    aulasDoDia.find((aula) => aula.id === aulaSelecionadaIdResolvido) ?? null;

  function turmaDaAula(aula: Aula) {
    if (!aula.turmaId) return undefined;
    return MOCK_TURMAS.find((turma) => turma.id === aula.turmaId);
  }

  function jogadoresDaTurma(turma?: Turma): Jogador[] {
    if (!turma) return [];
    return turma.jogadoresIds
      .map((id) => MOCK_JOGADORES_TURMAS.find((j) => j.id === id))
      .filter(Boolean) as Jogador[];
  }

  function adicionarAula() {
    const nomeTurma = prompt(
      `Qual turma terá aula neste dia?\n(Deixe vazio para criar um evento avulso)`
    );

    const turmaEncontrada = nomeTurma
      ? MOCK_TURMAS.find(
          (turma) =>
            turma.nome.toLowerCase() === nomeTurma.trim().toLowerCase()
        )
      : undefined;

    const novoId = aulas.reduce((max, aula) => Math.max(max, aula.id), 0) + 1;

    const novaAula: Aula = {
      id: novoId,
      turmaId: turmaEncontrada?.id,
      dataIso: dataIso ?? "",
      status: "PLANEJADA",
    };

    setAulas((lista) => [...lista, novaAula]);
    setAulaSelecionadaId(novoId);
  }

  function toggleTreinoCancelado() {
    setTreinoCancelado((prev) => !prev);
    // aqui depois você manda pro backend
  }

  const turmaSelecionada = aulaSelecionada ? turmaDaAula(aulaSelecionada) : undefined;
  const jogadoresRelacionados = jogadoresDaTurma(turmaSelecionada);

  const tituloDia = dataIso ?? "Dia";

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      {/* Cabeçalho do Dia */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>Dia de jogo</p>
          <h2 style={{ margin: "4px 0" }}>{tituloDia}</h2>
          <p style={{ margin: 0, color: "#1f2937", fontWeight: 600 }}>
            {formatarData(dataIso)}
          </p>
          {treinoCancelado && (
            <span
              style={{
                marginTop: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 8,
                background: "#fee2e2",
                color: "#b91c1c",
                fontSize: 12,
                border: "1px solid #fecaca",
              }}
            >
              X Treino cancelado
            </span>
          )}
        </div>

        <button onClick={toggleTreinoCancelado} style={{ height: 40 }}>
          {treinoCancelado
            ? "Reativar treino do dia"
            : "Marcar treino do dia como cancelado (X)"}
        </button>
      </div>

      {/* Aviso quando treino estiver cancelado */}
      {treinoCancelado && (
        <div
          style={{
            padding: 18,
            borderRadius: 8,
            background: "#fff5f5",
            border: "1px solid #fecaca",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>Treino cancelado</h3>
          <p style={{ fontSize: 14, lineHeight: "20px", margin: 0 }}>
            Este treino foi marcado como <strong>cancelado (X)</strong>. As
            configurações de equipes, partidas e súmula são mantidas apenas como
            histórico, mas você pode reativar o treino se a aula tiver acontecido.
          </p>
        </div>
      )}

      {/* Grade principal: cards de aulas e painel de gestão */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 16,
        }}
      >
        {/* Coluna esquerda: Aulas / eventos */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
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
              <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                Agenda do dia
              </p>
              <h3 style={{ margin: 0 }}>Aulas / eventos</h3>
            </div>
            <button onClick={adicionarAula}>+ Adicionar evento / aula</button>
          </div>

          {aulasDoDia.length === 0 ? (
            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: 10,
                padding: 16,
                marginTop: 12,
                textAlign: "center",
                color: "#475569",
              }}
            >
              Nenhuma aula/evento ainda para esta data.
              <br />
              Clique em <strong>"Adicionar evento / aula"</strong> para começar.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                marginTop: 12,
              }}
            >
              {aulasDoDia.map((aula) => {
                const turma = turmaDaAula(aula);
                const selecionada = aula.id === aulaSelecionadaIdResolvido;
                return (
                  <button
                    key={aula.id}
                    onClick={() => setAulaSelecionadaId(aula.id)}
                    style={{
                      border: selecionada
                        ? "2px solid #0ea5e9"
                        : "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 12,
                      textAlign: "left",
                      background: selecionada ? "#e0f2fe" : "#f8fafc",
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                      {turma ? turma.nome : "Evento avulso"}
                    </p>
                    <h4 style={{ margin: "4px 0" }}>Aula #{aula.id}</h4>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background:
                          aula.status === "CANCELADA" ? "#fee2e2" : "#dcfce7",
                        color:
                          aula.status === "CANCELADA" ? "#b91c1c" : "#166534",
                        fontSize: 12,
                        border:
                          aula.status === "CANCELADA"
                            ? "1px solid #fecaca"
                            : "1px solid #bbf7d0",
                      }}
                    >
                      {aula.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna direita: Gestão da aula selecionada */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
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
              <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                Gestão da aula selecionada
              </p>
              <h3 style={{ margin: 0 }}>
                {aulaSelecionada
                  ? turmaSelecionada?.nome ?? "Evento avulso"
                  : "Selecione uma aula"}
              </h3>
            </div>
            {aulaSelecionada && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#e0f2fe",
                  color: "#075985",
                  border: "1px solid #bae6fd",
                }}
              >
                Status: {aulaSelecionada.status}
              </span>
            )}
          </div>

          {!aulaSelecionada ? (
            <p style={{ marginTop: 12, color: "#475569" }}>
              Escolha um card de aula para gerenciar jogadores, equipes e
              partidas.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
              <section
                style={{
                  padding: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#f8fafc",
                }}
              >
                <h4 style={{ marginTop: 0 }}>Jogadores da turma</h4>
                {jogadoresRelacionados.length === 0 ? (
                  <p style={{ color: "#475569" }}>
                    Nenhum jogador vinculado a esta turma. Use a tela de{" "}
                    <strong>Turmas</strong> para gerenciar a lista.
                  </p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#0f172a" }}>
                    {jogadoresRelacionados.map((jogador) => (
                      <li key={jogador.id}>
                        {jogador.nome}
                        {jogador.apelido ? ` (${jogador.apelido})` : ""} –{" "}
                        {jogador.posicao}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section
                style={{
                  padding: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#f8fafc",
                }}
              >
                <h4 style={{ marginTop: 0 }}>Equipes</h4>
                <p style={{ margin: 0, color: "#475569" }}>
                  Aqui depois entra a gestão de equipes para esta aula
                  (drag-and-drop etc.), sem uso de abas.
                </p>
              </section>

              <section
                style={{
                  padding: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#f8fafc",
                }}
              >
                <h4 style={{ marginTop: 0 }}>Partidas</h4>
                <p style={{ margin: 0, color: "#475569" }}>
                  Configure as partidas e súmula aqui na mesma página.
                </p>
              </section>

              <section
                style={{
                  padding: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#f8fafc",
                }}
              >
                <h4 style={{ marginTop: 0 }}>Atributos / observações</h4>
                <p style={{ margin: 0, color: "#475569" }}>
                  Campo livre para atributos da aula, sem navegação em abas.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
