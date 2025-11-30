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
    return <div className="page-container">Data inválida.</div>;
  }

  const dataObj = parseISO(dataIso);
  const tituloData = format(dataObj, "yyyy-MM-dd");
  const linhaData = format(dataObj, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="page-header-title">Dia de jogo {tituloData}</div>
            <div className="page-header-subtitle">Carregando dados do dia...</div>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-ghost" onClick={() => navigate("/dias")}>
              &larr; Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dia) {
    // Nenhuma aula/evento ainda: tela padrão
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="page-header-title">Dia de jogo {tituloData}</div>
            <div className="page-header-subtitle">{linhaData}</div>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-ghost" onClick={() => navigate("/dias")}>
              &larr; Voltar
            </button>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header">
            <div className="card-title">Nenhuma aula planejada</div>
          </div>
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
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-header-title">Dia de jogo {tituloData}</div>
          <div className="page-header-subtitle">{linhaData}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {dia.feriado && (
              <span className="chip">
                Feriado ({dia.feriado.tipo}): {dia.feriado.nome}
              </span>
            )}

            <button className="btn btn-ghost btn-sm">
              Marcar treino do dia como cancelado (X)
            </button>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost" onClick={() => navigate("/dias")}>
            &larr; Voltar
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}
      >
        {/* Coluna esquerda – lista de aulas / eventos */}
        <section className="card">
          <div className="card-header" style={{ alignItems: "center" }}>
            <div>
              <div className="card-title">Aulas / eventos</div>
            </div>
            <button className="btn btn-success btn-sm">+ Adicionar evento / aula</button>
          </div>

          {aulasOrdenadas.length === 0 ? (
            <p className="card-subtitle">Nenhuma aula planejada para este dia.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {aulasOrdenadas.map((aula) => {
                const selecionada = aulaSelecionada?.id === aula.id;
                const totalJogadores = aula.jogadores.length;

                return (
                  <button
                    key={aula.id}
                    onClick={() => setAulaSelecionadaId(aula.id)}
                    className="card"
                    style={{
                      textAlign: "left",
                      borderWidth: selecionada ? 2 : 1,
                      borderColor: selecionada ? "#2563eb" : undefined,
                      background: selecionada ? "#eff6ff" : undefined,
                    }}
                  >
                    <div className="card-subtitle">{aula.turmaNome}</div>
                    <div className="card-title" style={{ marginBottom: 4 }}>
                      Aula #{aula.numeroAulaNaTurma}
                    </div>
                    <div className="card-subtitle">
                      {aula.horarioInicio} – {aula.horarioFim}
                    </div>
                    <div className="card-subtitle" style={{ marginTop: 4 }}>
                      {totalJogadores} jogador(es) da turma
                    </div>
                    <span className="badge badge-warning" style={{ marginTop: 6 }}>
                      Status: {aula.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Coluna direita – painel resumido da aula selecionada */}
        <section className="card">
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
    <div className="card" style={{ gap: 12, display: "flex", flexDirection: "column" }}>
      <div className="card-header" style={{ alignItems: "flex-start", gap: 16 }}>
        <div>
          <div className="card-subtitle">Gestão da aula selecionada</div>
          <div className="card-title" style={{ marginBottom: 4 }}>
            {aula.turmaNome}
          </div>
          <div className="card-subtitle">
            Aula #{aula.numeroAulaNaTurma} &bull; {aula.horarioInicio} – {aula.horarioFim}
          </div>
        </div>

        {/* Status + botão de abrir gestão completa */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="badge badge-success">Status: {aula.status}</span>

          <Link className="btn btn-primary btn-sm" to={`/dias/${dia.dataIso}/aulas/${aula.id}`}>
            Abrir gestão da turma
          </Link>
        </div>
      </div>

      {/* Jogadores */}
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ marginBottom: 0 }}>Jogadores da turma</div>
        </div>
        <div className="card-subtitle">
          {totalJogadores} no total &mdash; {presentes} presença(s), {faltas} falta(s), {atestados}
          {" "}
          atestado(s), {curingas} curinga(s).
        </div>
      </div>

      {/* Equipes */}
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ marginBottom: 0 }}>Equipes</div>
        </div>
        <div className="card-subtitle">
          {totalTimes === 0
            ? "Nenhuma equipe criada ainda."
            : `${totalTimes} equipe(s) criada(s), ${semTime} jogador(es) sem equipe.`}
        </div>
        <div className="card-subtitle" style={{ marginTop: 8 }}>
          A gestão detalhada das equipes será feita na tela da aula (drag-and-drop, etc.).
        </div>
      </div>

      {/* Partidas */}
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ marginBottom: 0 }}>Partidas</div>
        </div>
        <div className="card-subtitle">
          {aula.partidasCount === 0
            ? "Nenhuma partida configurada."
            : `${aula.partidasCount} partida(s) configurada(s).`}
        </div>
        <div className="card-subtitle" style={{ marginTop: 8 }}>
          A súmula e os gols também serão lançados na tela da aula.
        </div>
      </div>
    </div>
  );
}
