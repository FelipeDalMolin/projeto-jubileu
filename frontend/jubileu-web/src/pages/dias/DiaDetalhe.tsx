// src/pages/dias/DiaDetalhe.tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obterDiaPorData, ordenarAulasPorHorario, criarAulaNoDia } from "../../services/diasService";
import type { Dia, AulaDia } from "../../types/dia";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DiaDetalhe() {
  const { dataIso } = useParams<{ dataIso: string }>();
  const navigate = useNavigate();

  const [dia, setDia] = useState<Dia | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // estado do form de nova aula
  const [novaTurmaNome, setNovaTurmaNome] = useState<string>("");
  const [novaHorarioInicio, setNovaHorarioInicio] = useState<string>("19:00");
  const [novaHorarioFim, setNovaHorarioFim] = useState<string>("20:00");
  const [criandoAula, setCriandoAula] = useState(false);

  useEffect(() => {
    if (!dataIso) {
      setErro("Data inválida.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);

    obterDiaPorData(dataIso)
      .then((d) => {
        const ordenadas = ordenarAulasPorHorario(d.aulas ?? []);
        setDia({ ...d, aulas: ordenadas });
      })
      .catch((e) => {
        console.error(e);
        setErro("Erro ao carregar informações do dia.");
      })
      .finally(() => setLoading(false));
  }, [dataIso]);

  if (!dataIso) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia inválido</h1>
      </div>
    );
  }

  const dataObj = parseISO(dataIso);
  const tituloData = format(dataObj, "dd/MM/yyyy (EEEE)", { locale: ptBR });

  const handleSubmitNovaAula = async (e: FormEvent) => {
    e.preventDefault();
    if (!dia) return;
    if (!novaTurmaNome.trim()) {
      alert("Informe o nome da turma.");
      return;
    }

    try {
      setCriandoAula(true);

      // Calcula o número da aula dentro da turma
      const totalNaTurma = dia.aulas.filter(
        (a) => a.turmaNome.toLowerCase() === novaTurmaNome.toLowerCase(),
      ).length;
      const numeroAulaNaTurma = totalNaTurma + 1;

      const turmaId = novaTurmaNome
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const nova = await criarAulaNoDia(dataIso, {
        turmaId,
        turmaNome: novaTurmaNome.trim(),
        numeroAulaNaTurma,
        horarioInicio: novaHorarioInicio,
        horarioFim: novaHorarioFim,
      });

      setDia((prev) => {
        if (!prev) return prev;
        const novasAulas = ordenarAulasPorHorario([...prev.aulas, nova]);
        return { ...prev, aulas: novasAulas };
      });

      // limpa o form
      setNovaTurmaNome("");
      setNovaHorarioInicio("19:00");
      setNovaHorarioFim("20:00");
    } catch (err) {
      console.error(err);
      alert("Erro ao criar aula. Veja o console para detalhes.");
    } finally {
      setCriandoAula(false);
    }
  };

  const handleChangeTurmaNome = (e: ChangeEvent<HTMLInputElement>) => {
    setNovaTurmaNome(e.target.value);
  };

  const handleChangeHorarioInicio = (e: ChangeEvent<HTMLInputElement>) => {
    setNovaHorarioInicio(e.target.value);
  };

  const handleChangeHorarioFim = (e: ChangeEvent<HTMLInputElement>) => {
    setNovaHorarioFim(e.target.value);
  };

  const irParaAula = (aula: AulaDia) => {
    navigate(`/dias/${dataIso}/aulas/${aula.id}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia {tituloData}</h1>
        <p>Carregando informações do dia...</p>
      </div>
    );
  }

  if (erro || !dia) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate("/dias")}>&larr; Voltar</button>
        <h1>Dia {tituloData}</h1>
        <p style={{ color: "#b91c1c" }}>{erro ?? "Dia não encontrado."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate("/dias")}>&larr; Voltar</button>

      <header style={{ marginTop: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dia {tituloData}</h1>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Aqui você gerencia as aulas e as equipes deste dia.
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
          <div style={{ minWidth: 180 }}>
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
            <input
              type="text"
              value={novaTurmaNome}
              onChange={handleChangeTurmaNome}
              placeholder="Ex.: Sub-11, Adulto..."
              style={{
                width: "100%",
                padding: "4px 8px",
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
              Início
            </label>
            <input
              type="time"
              value={novaHorarioInicio}
              onChange={handleChangeHorarioInicio}
              style={{
                padding: "4px 8px",
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
              onChange={handleChangeHorarioFim}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <button
              type="submit"
              disabled={criandoAula}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid #16a34a",
                background: criandoAula ? "#bbf7d0" : "#22c55e",
                color: "#fff",
                fontSize: 13,
                cursor: criandoAula ? "default" : "pointer",
              }}
            >
              {criandoAula ? "Criando..." : "Adicionar aula"}
            </button>
          </div>
        </form>
      </section>

      {/* Lista de aulas já cadastradas */}
      <section>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Aulas do dia</h2>

        {dia.aulas.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Nenhuma aula planejada ainda. Use o formulário acima para cadastrar
            a primeira aula.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {dia.aulas.map((aula) => (
              <AulaCard
                key={aula.id}
                dia={dia}
                aula={aula}
                onAbrir={() => irParaAula(aula)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type AulaCardProps = {
  dia: Dia;
  aula: AulaDia;
  onAbrir: () => void;
};

function AulaCard({ dia, aula, onAbrir }: AulaCardProps) {
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
            {aula.turmaNome} – Aula #{aula.numeroAulaNaTurma}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {aula.horarioInicio} – {aula.horarioFim} • {aula.tipo}
          </div>
          <div style={{ fontSize: 11, color: "#0f172a" }}>
            {aula.times.length} time(s) • {aula.partidasCount} partida(s)
          </div>
        </div>

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
          Abrir gestão da turma
        </button>
      </div>
    </div>
  );
}
