// src/pages/dias/DiaDetalhe.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  obterDiaPorData,
  ordenarAulasPorHorario,
} from "../../services/diasService";
import type { AulaDia, Dia } from "../../types/dia";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DiaDetalhe() {
  const { dataIso } = useParams<{ dataIso: string }>();
  const navigate = useNavigate();
  const [dia, setDia] = useState<Dia | null>(null);
  const [loading, setLoading] = useState(true);
  const [aulaSelecionadaId, setAulaSelecionadaId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!dataIso) return;
    setLoading(true);
    obterDiaPorData(dataIso)
      .then((result) => {
        setDia(result);
        if (result && result.aulas.length > 0) {
          setAulaSelecionadaId(result.aulas[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [dataIso]);

  if (!dataIso) {
    return <div style={{ padding: 24 }}>Data inválida.</div>;
  }

  const dataObj = parseISO(dataIso);
  const tituloData = format(dataObj, "yyyy-MM-dd");
  const linhaData = format(dataObj, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia de jogo {tituloData}</h1>
        <p>Carregando dados do dia...</p>
      </div>
    );
  }

  if (!dia) {
    // Nenhuma aula/evento ainda: tela padrão
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>

        <h1>Dia de jogo {tituloData}</h1>
        <p style={{ color: "#555" }}>{linhaData}</p>

        <div
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 12,
            border: "1px solid #dde1e7",
            background: "#f8fafc",
            maxWidth: 600,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Nenhuma aula planejada</h2>
          <p>
            Este dia ainda não possui aulas ou eventos cadastrados. Você poderá
            adicionar aulas no futuro para montar as equipes e registrar as
            partidas.
          </p>
        </div>
      </div>
    );
  }

  const aulasOrdenadas = ordenarAulasPorHorario(dia.aulas);
  const aulaSelecionada: AulaDia | undefined =
    aulasOrdenadas.find((a) => a.id === aulaSelecionadaId) ??
    aulasOrdenadas[0];

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate("/dias")}>&larr; Voltar</button>

      <header style={{ marginTop: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dia de jogo {tituloData}</h1>
        <p style={{ margin: 0, color: "#555" }}>{linhaData}</p>

        <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {dia.feriado && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #ffd27f",
                background: "#fff5e0",
                fontSize: 12,
              }}
            >
              Feriado ({dia.feriado.tipo}): {dia.feriado.nome}
            </span>
          )}

          <button
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Marcar treino do dia como cancelado (X)
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 340px) minmax(360px, 1fr)",
          gap: 24,
        }}
      >
        {/* Coluna esquerda – lista de aulas / eventos */}
        <section
          style={{
            borderRadius: 12,
            border: "1px solid #dde1e7",
            padding: 16,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>Aulas / eventos</h2>
            <button
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #22c55e",
                background: "#dcfce7",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              + Adicionar evento / aula
            </button>
          </div>

          {aulasOrdenadas.length === 0 ? (
            <p style={{ color: "#555" }}>
              Nenhuma aula planejada para este dia.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {aulasOrdenadas.map((aula) => {
                const selecionada = aulaSelecionada?.id === aula.id;
                const totalJogadores = aula.jogadores.length;

                return (
                  <button
                    key={aula.id}
                    onClick={() => setAulaSelecionadaId(aula.id)}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      borderRadius: 10,
                      border: selecionada
                        ? "2px solid #2563eb"
                        : "1px solid #e2e8f0",
                      background: selecionada ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {aula.turmaNome}
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      Aula #{aula.numeroAulaNaTurma}
                    </div>
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {aula.horarioInicio} – {aula.horarioFim}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
                      {totalJogadores} jogador(es) da turma
                    </div>
                    <span
                      style={{
                        marginTop: 6,
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        border: "1px solid #a5b4fc",
                        background: "#eef2ff",
                      }}
                    >
                      Status: {aula.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Coluna direita – painel resumido da aula selecionada */}
        <section
          style={{
            borderRadius: 12,
            border: "1px solid #dde1e7",
            padding: 16,
            background: "#fff",
          }}
        >
          {aulaSelecionada ? (
            <PainelResumoAula dia={dia} aula={aulaSelecionada} />
          ) : (
            <p>Nenhuma aula selecionada.</p>
          )}
        </section>
      </div>
    </div>
  );
}

type PainelResumoProps = {
  dia: Dia;
  aula: AulaDia;
};

function PainelResumoAula({ dia, aula }: PainelResumoProps) {
  const totalJogadores = aula.jogadores.length;
  const presentes = aula.jogadores.filter((j) => j.status === "presente").length;
  const faltas = aula.jogadores.filter((j) => j.status === "faltou").length;
  const atestados = aula.jogadores.filter((j) => j.status === "atestado").length;
  const curingas = aula.jogadores.filter((j) => j.status === "coringa").length;

  const totalTimes = aula.times.length;
  const totalEmTimes = aula.times.reduce(
    (acc, t) => acc + t.jogadoresIds.length,
    0
  );
  const semTime = Math.max(totalJogadores - totalEmTimes, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#555" }}>
            Gestão da aula selecionada
          </div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{aula.turmaNome}</h2>
          <div style={{ fontSize: 12, color: "#555" }}>
            Aula #{aula.numeroAulaNaTurma} &bull; {aula.horarioInicio} –{" "}
            {aula.horarioFim}
          </div>
        </div>

        {/* Status + botão de abrir gestão completa */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              fontSize: 12,
            }}
          >
            Status: {aula.status}
          </span>

          <Link
            to={`/dias/${dia.dataIso}/aulas/${aula.id}`}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#fff",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            Abrir gestão da turma
          </Link>
        </div>
      </div>

      {/* Jogadores */}
      <div
        style={{
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          padding: 12,
          background: "#f8fafc",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Jogadores da turma
        </div>
        <div style={{ fontSize: 13, color: "#555" }}>
          {totalJogadores} no total &mdash; {presentes} presença(s), {faltas}{" "}
          falta(s), {atestados} atestado(s), {curingas} curinga(s).
        </div>
      </div>

      {/* Equipes */}
      <div
        style={{
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          padding: 12,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Equipes</div>
        <div style={{ fontSize: 13, color: "#555" }}>
          {totalTimes === 0
            ? "Nenhuma equipe criada ainda."
            : `${totalTimes} equipe(s) criada(s), ${semTime} jogador(es) sem equipe.`}
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          A gestão detalhada das equipes será feita na tela da aula
          (drag-and-drop, etc.).
        </div>
      </div>

      {/* Partidas */}
      <div
        style={{
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          padding: 12,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Partidas</div>
        <div style={{ fontSize: 13, color: "#555" }}>
          {aula.partidasCount === 0
            ? "Nenhuma partida configurada."
            : `${aula.partidasCount} partida(s) configurada(s).`}
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          A súmula e os gols também serão lançados na tela da aula.
        </div>
      </div>
    </div>
  );
}
