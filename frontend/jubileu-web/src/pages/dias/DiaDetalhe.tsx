// src/pages/dias/DiaDetalhe.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  obterDiaPorData,
  ordenarAulasPorHorario,
  criarAulaNoDia,
  deletarAulaNoDia,
} from "../../services/diasService";
import { listarTurmas, type Turma } from "../../services/turmasService";
import type { Dia, AulaDia } from "../../types/dia";

export default function DiaDetalhe() {
  const { dataIso } = useParams<{ dataIso: string }>();
  const navigate = useNavigate();

  const [dia, setDia] = useState<Dia | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // form nova aula
  const [novaTurmaId, setNovaTurmaId] = useState<number | "">("");
  const [novaHorarioInicio, setNovaHorarioInicio] = useState("19:00");
  const [novaHorarioFim, setNovaHorarioFim] = useState("20:00");
  const [criandoAula, setCriandoAula] = useState(false);

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

      const ordenadas = ordenarAulasPorHorario(d.aulas ?? []);
      setDia({ ...d, aulas: ordenadas });

      // define default turma no select
      if (t.length > 0 && novaTurmaId === "") {
        setNovaTurmaId(t[0].id);
      }
    } catch (e: any) {
      console.error(e);
      setErro(e?.message ?? "Erro ao carregar informacoes do dia.");
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

  const handleSubmitNovaAula = async (e: FormEvent) => {
    e.preventDefault();
    if (!dataIso) return;
    if (!dia) return;

    if (novaTurmaId === "") {
      alert("Selecione uma turma.");
      return;
    }

    try {
      setCriandoAula(true);

      const nova = await criarAulaNoDia(dataIso, {
        turmaId: Number(novaTurmaId),
        horarioInicio: novaHorarioInicio,
        horarioFim: novaHorarioFim,
      });

      setDia((prev) => {
        if (!prev) return prev;
        const novasAulas = ordenarAulasPorHorario([...prev.aulas, nova]);
        return { ...prev, aulas: novasAulas };
      });

      // mantem turma selecionada e reseta horarios (opcional)
      setNovaHorarioInicio("19:00");
      setNovaHorarioFim("20:00");
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao criar aula. Veja o console.");
    } finally {
      setCriandoAula(false);
    }
  };

  const irParaAula = (aula: AulaDia) => {
    navigate(`/dias/${dataIso}/aulas/${aula.id}`);
  };

  const handleExcluirAula = async (aula: AulaDia) => {
    if (!dataIso) return;
    const confirmar = window.confirm(
      `Excluir a Aula #${aula.numeroAulaNaTurma} da turma ${aula.turmaNome}?`,
    );
    if (!confirmar) return;

    try {
      await deletarAulaNoDia(dataIso, aula.id);
      setDia((prev) => {
        if (!prev) return prev;
        const filtradas = prev.aulas.filter((a) => a.id !== aula.id);
        return { ...prev, aulas: filtradas };
      });
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao excluir aula. Veja o console.");
    }
  };

  if (!dataIso) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia invalido</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia {tituloData}</h1>
        <p>Carregando informacoes do dia...</p>
      </div>
    );
  }

  if (erro || !dia) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia {tituloData}</h1>
        <p style={{ color: "#b91c1c" }}>{erro ?? "Dia nao encontrado."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate("/dias")}>&larr; Voltar</button>

      <header style={{ marginTop: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dia {tituloData}</h1>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Aqui voce gerencia as aulas e as equipes deste dia.
        </p>
      </header>

      {/* Form de nova aula */}
      <section
        style={{
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: 16,
          marginBottom: 24,
          background: "#f8fafc",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Nova aula / evento</h2>

        <form
          onSubmit={handleSubmitNovaAula}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
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
              type="submit"
              disabled={criandoAula || turmas.length === 0 || novaTurmaId === ""}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid #16a34a",
                background:
                  criandoAula || turmas.length === 0 || novaTurmaId === ""
                    ? "#bbf7d0"
                    : "#22c55e",
                color: "#fff",
                fontSize: 13,
                cursor:
                  criandoAula || turmas.length === 0 || novaTurmaId === ""
                    ? "default"
                    : "pointer",
              }}
            >
              {criandoAula ? "Criando..." : "Adicionar aula"}
            </button>
          </div>
        </form>
      </section>

      {/* Lista de aulas */}
      <section>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Aulas do dia</h2>

        {dia.aulas.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Nenhuma aula planejada ainda. Use o formulario acima para cadastrar
            a primeira aula.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dia.aulas.map((aula) => (
              <AulaCard
                key={aula.id}
                aula={aula}
                onAbrir={() => irParaAula(aula)}
                onExcluir={() => handleExcluirAula(aula)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type AulaCardProps = {
  aula: AulaDia;
  onAbrir: () => void;
  onExcluir: () => void;
};

function AulaCard({ aula, onAbrir, onExcluir }: AulaCardProps) {
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
            {aula.turmaNome || `Turma #${aula.turmaId}`} - Aula #{aula.numeroAulaNaTurma}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {aula.horarioInicio} - {aula.horarioFim} - {aula.tipo}
          </div>
          <div style={{ fontSize: 11, color: "#0f172a" }}>
            {aula.times.length} time(s) - {aula.partidasCount} partida(s)
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
            🗑 Excluir aula
          </button>
          <button
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
            Abrir gestao da turma
          </button>
        </div>
      </div>
    </div>
  );
}
