// src/pages/dias/DiaDetalhe.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  obterDiaPorData,
  ordenarEventosPorHorario,
  criarEventoNoDia,
  deletarEventoNoDia,
} from "../../services/diasService";
import { listarTurmas, type Turma } from "../../services/turmasService";
import type { Dia, EventoDia, TipoEventoModo } from "../../types/dia";

const EVENTO_MODO_OPTIONS: Array<{ value: TipoEventoModo; label: string; hint: string }> = [
  {
    value: "AULA",
    label: "AULA",
    hint: "Treino regular com turma.",
  },
  {
    value: "JOGO_LIVRE",
    label: "Jogo livre",
    hint: "Evento aberto com RSVP, check-in e fila.",
  },
  {
    value: "OUTRO",
    label: "Outro",
    hint: "Uso administrativo ou modo futuro.",
  },
];

function eventoModoLabel(tipo: TipoEventoModo) {
  return EVENTO_MODO_OPTIONS.find((option) => option.value === tipo)?.label ?? tipo;
}

function eventoTitulo(evento: EventoDia) {
  if (evento.turmaNome) {
    const numero = evento.numeroEventoNaTurma ? ` #${evento.numeroEventoNaTurma}` : "";
    return `${evento.turmaNome} - Evento${numero}`;
  }
  return `${eventoModoLabel(evento.tipo)} - Evento #${evento.id}`;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function DiaDetalhe() {
  const { dataIso } = useParams<{ dataIso: string }>();
  const navigate = useNavigate();

  const [dia, setDia] = useState<Dia | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // form novo evento
  const [novaTurmaId, setNovaTurmaId] = useState<number | "">("");
  const [novaTipo, setNovaTipo] = useState<TipoEventoModo>("AULA");
  const [novaHorarioInicio, setNovaHorarioInicio] = useState("19:00");
  const [novaHorarioFim, setNovaHorarioFim] = useState("20:00");
  const [criandoEvento, setCriandoEvento] = useState(false);
  const exigeTurma = novaTipo === "AULA";

  const tituloData = useMemo(() => {
    if (!dataIso) return "Dia invalido";
    const dataObj = parseISO(dataIso);
    return format(dataObj, "dd/MM/yyyy (EEEE)", { locale: ptBR });
  }, [dataIso]);

  async function carregarTudo(iso: string) {
    setLoading(true);
    setErro(null);
    try {
      const [d, t] = await Promise.all([obterDiaPorData(iso), listarTurmas()]);
      setTurmas(t);

      const ordenadas = ordenarEventosPorHorario(d.eventos ?? []);
      setDia({ ...d, eventos: ordenadas });

      // define default turma no select
      if (t.length > 0 && novaTurmaId === "") {
        setNovaTurmaId(t[0].id);
      }
    } catch (e: unknown) {
      console.error(e);
      setErro(errorMessage(e, "Erro ao carregar informacoes do dia."));
      setDia(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!dataIso) {
      setErro("Data invalida.");
      setLoading(false);
      return;
    }
    carregarTudo(dataIso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataIso]);

  const handleSubmitNovaEvento = async (e: FormEvent) => {
    e.preventDefault();
    if (!dataIso) return;
    if (!dia) return;

    if (exigeTurma && novaTurmaId === "") {
      alert("Selecione uma turma.");
      return;
    }

    try {
      setCriandoEvento(true);

      const nova = await criarEventoNoDia(dataIso, {
        turmaId: exigeTurma ? Number(novaTurmaId) : null,
        tipo: novaTipo,
        horarioInicio: novaHorarioInicio,
        horarioFim: novaHorarioFim,
      });

      setDia((prev) => {
        if (!prev) return prev;
        const novasEventos = ordenarEventosPorHorario([...prev.eventos, nova]);
        return { ...prev, eventos: novasEventos };
      });

      // mantem turma e modo selecionados; reseta somente horarios.
      setNovaHorarioInicio("19:00");
      setNovaHorarioFim("20:00");
    } catch (err: unknown) {
      console.error(err);
      alert(errorMessage(err, "Erro ao criar evento. Veja o console."));
    } finally {
      setCriandoEvento(false);
    }
  };

  const irParaEvento = (evento: EventoDia) => {
    navigate(`/dias/${dataIso}/eventos/${evento.id}`);
  };

  const handleExcluirEvento = async (evento: EventoDia) => {
    if (!dataIso) return;
    const confirmar = window.confirm(`Excluir ${eventoTitulo(evento)}?`);
    if (!confirmar) return;

    try {
      await deletarEventoNoDia(dataIso, evento.id);
      setDia((prev) => {
        if (!prev) return prev;
        const filtradas = prev.eventos.filter((a) => a.id !== evento.id);
        return { ...prev, eventos: filtradas };
      });
    } catch (err: unknown) {
      console.error(err);
      alert(errorMessage(err, "Erro ao excluir evento. Veja o console."));
    }
  };

  if (!dataIso) {
    return (
      <div data-testid="page-dia-detalhe" style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia invalido</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-testid="page-dia-detalhe" style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia {tituloData}</h1>
        <p>Carregando informacoes do dia...</p>
      </div>
    );
  }

  if (erro || !dia) {
    return (
      <div data-testid="page-dia-detalhe" style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia {tituloData}</h1>
        <p style={{ color: "#b91c1c" }}>{erro ?? "Dia nao encontrado."}</p>
      </div>
    );
  }

  return (
    <div data-testid="page-dia-detalhe" style={{ padding: 24 }}>
      <button onClick={() => navigate("/dias")}>&larr; Voltar</button>

      <header style={{ marginTop: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dia {tituloData}</h1>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Aqui voce gerencia os eventos e as equipes deste dia.
        </p>
      </header>

      {/* Form de novo evento */}
      <section
        style={{
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: 16,
          marginBottom: 24,
          background: "#f8fafc",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Novo evento</h2>

        <form
          data-testid="form-evento"
          onSubmit={handleSubmitNovaEvento}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ minWidth: 180 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                marginBottom: 4,
                color: "#0f172a",
              }}
            >
              Modo
            </label>

            <select
              data-testid="select-evento-tipo"
              value={novaTipo}
              onChange={(e) => setNovaTipo(e.target.value as TipoEventoModo)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                background: "#fff",
              }}
            >
              {EVENTO_MODO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>
              {EVENTO_MODO_OPTIONS.find((option) => option.value === novaTipo)?.hint}
            </div>
          </div>

          {exigeTurma ? (
            <div style={{ minWidth: 220 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  marginBottom: 4,
                  color: "#0f172a",
                }}
              >
                Turma
              </label>

              <select
                data-testid="select-evento-turma"
                value={novaTurmaId}
                onChange={(e) =>
                  setNovaTurmaId(e.target.value ? Number(e.target.value) : "")
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  background: "#fff",
                }}
              >
                {turmas.length === 0 ? (
                  <option value="">Nenhuma turma cadastrada</option>
                ) : (
                  turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : null}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                marginBottom: 4,
                color: "#0f172a",
              }}
            >
              Inicio
            </label>
            <input
              type="time"
              value={novaHorarioInicio}
              onChange={(e) => setNovaHorarioInicio(e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                marginBottom: 4,
                color: "#0f172a",
              }}
            >
              Fim
            </label>
            <input
              type="time"
              value={novaHorarioFim}
              onChange={(e) => setNovaHorarioFim(e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <button
              data-testid="button-criar-evento"
              type="submit"
              disabled={criandoEvento || (exigeTurma && (turmas.length === 0 || novaTurmaId === ""))}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid #16a34a",
                background:
                  criandoEvento || (exigeTurma && (turmas.length === 0 || novaTurmaId === ""))
                    ? "#bbf7d0"
                    : "#22c55e",
                color: "#fff",
                fontSize: 13,
                cursor:
                  criandoEvento || (exigeTurma && (turmas.length === 0 || novaTurmaId === ""))
                    ? "default"
                    : "pointer",
              }}
            >
              {criandoEvento ? "Criando..." : "Adicionar evento"}
            </button>
          </div>
        </form>
      </section>

      {/* Lista de eventos */}
      <section>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Eventos do dia</h2>

        {dia.eventos.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Nenhum evento planejado ainda. Use o formulario acima para cadastrar
            o primeiro evento.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dia.eventos.map((evento) => (
              <EventoCard
                key={evento.id}
                evento={evento}
                onAbrir={() => irParaEvento(evento)}
                onExcluir={() => handleExcluirEvento(evento)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type EventoCardProps = {
  evento: EventoDia;
  onAbrir: () => void;
  onExcluir: () => void;
};

function EventoCard({ evento, onAbrir, onExcluir }: EventoCardProps) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        padding: 12,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {eventoTitulo(evento)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {evento.horarioInicio} - {evento.horarioFim} - {eventoModoLabel(evento.tipo)}
          </div>
          <div style={{ fontSize: 11, color: "#0f172a" }}>
            {evento.times.length} time(s) - {evento.partidasCount} partida(s)
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onExcluir}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #dc2626",
              background: "#fff1f2",
              color: "#dc2626",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Excluir evento
          </button>
          <button
            data-testid="button-abrir-evento"
            onClick={onAbrir}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Abrir evento
          </button>
        </div>
      </div>
    </div>
  );
}
