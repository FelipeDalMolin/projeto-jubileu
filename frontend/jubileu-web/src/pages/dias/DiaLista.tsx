// src/pages/dias/DiaLista.tsx
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { listarDias } from "../../services/diasService";
import type { Dia } from "../../types/dia";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DiaLista() {
  const [dias, setDias] = useState<Dia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);

  const navigate = useNavigate();

  // Carrega os dias (mock por enquanto)
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const data = await listarDias();

        if (cancelado) return;

        const ordenados = [...data].sort((a, b) =>
          a.dataIso.localeCompare(b.dataIso)
        );
        setDias(ordenados);

        if (ordenados.length > 0) {
          setSelectedDateIso(ordenados[0].dataIso);
          const firstDate = parseISO(ordenados[0].dataIso);
          setCurrentMonth(firstDate);
        }
      } catch (e) {
        console.error("Erro ao carregar dias:", e);
        if (!cancelado) {
          setErro("Não foi possível carregar os dias.");
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, []);

  // Mapa dataIso -> Dia
  const diasPorIso = useMemo(() => {
    const map = new Map<string, Dia>();
    for (const d of dias) {
      map.set(d.dataIso, d);
    }
    return map;
  }, [dias]);

  // Dias do mês atual que têm aulas/eventos
  const diasDoMesAtual = useMemo(() => {
    return dias.filter((dia) => {
      const dt = parseISO(dia.dataIso);
      return (
        dt.getMonth() === currentMonth.getMonth() &&
        dt.getFullYear() === currentMonth.getFullYear()
      );
    });
  }, [dias, currentMonth]);

  const monthLabel = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

  // Estados de loading / erro bem explícitos pra não ficar tela branca
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Agenda de dias</h1>
        <p>Carregando dias...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Agenda de dias</h1>
        <p style={{ color: "#b91c1c" }}>{erro}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Agenda de dias</h1>
      <p style={{ color: "#64748b", fontSize: 14 }}>
        Use o calendário para navegar e selecione um dia para ver as aulas.
      </p>

      {/* CALENDÁRIO + CONTROLES DE MÊS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 400px) minmax(260px, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Coluna esquerda: calendário */}
        <section
          style={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 16,
            background: "#fff",
          }}
        >
          {/* Cabeçalho do mês */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setCurrentMonth((prev) => addMonths(prev, -1))
              }
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ← Mês anterior
            </button>

            <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
              {monthLabel}
            </div>

            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Próximo mês →
            </button>
          </div>

          {/* Cabeçalho dos dias da semana */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              fontSize: 11,
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Grade de dias */}
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDateIso={selectedDateIso}
            onSelectDate={(iso) => {
              setSelectedDateIso(iso);
              if (diasPorIso.has(iso)) {
                navigate(`/dias/${iso}`);
              }
            }}
            diasPorIso={diasPorIso}
          />
        </section>

        {/* Coluna direita: lista de dias do mês com aulas/eventos */}
        <section
          style={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 16,
            background: "#fff",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 16 }}>
            Dias com aulas / eventos no mês
          </h2>

          {diasDoMesAtual.length === 0 ? (
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Nenhuma aula ou evento cadastrado para este mês ainda.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {diasDoMesAtual.map((dia) => {
                const dateObj = parseISO(dia.dataIso);
                const titulo = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
                const semana = format(dateObj, "EEEE", { locale: ptBR });
                const totalAulas = dia.aulas.length;

                return (
                  <li key={dia.dataIso} style={{ marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/dias/${dia.dataIso}`)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{titulo}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          textTransform: "capitalize",
                        }}
                      >
                        {semana}
                      </div>
                      <div style={{ fontSize: 12, color: "#0f172a" }}>
                        {totalAulas === 0
                          ? "Nenhuma aula planejada"
                          : `${totalAulas} aula(s) / evento(s)`}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

type CalendarGridProps = {
  currentMonth: Date;
  selectedDateIso: string | null;
  onSelectDate: (iso: string) => void;
  diasPorIso: Map<string, Dia>;
};

function CalendarGrid({
  currentMonth,
  selectedDateIso,
  onSelectDate,
  diasPorIso,
}: CalendarGridProps) {
  const today = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // segunda
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows: ReactNode[] = [];
  let days: ReactNode[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const iso = format(cloneDay, "yyyy-MM-dd");

      const isCurrentMonth = isSameMonth(cloneDay, monthStart);
      const isToday = isSameDay(cloneDay, today);
      const isSelected = selectedDateIso === iso;
      const diaAgenda = diasPorIso.get(iso);

      const baseStyle: CSSProperties = {
        margin: 2,
        padding: "6px 0",
        borderRadius: 6,
        border: "1px solid transparent",
        fontSize: 13,
        cursor: "pointer",
        background: "#fff",
        color: "#0f172a",
      };

      if (!isCurrentMonth) {
        baseStyle.color = "#94a3b8";
      }
      if (diaAgenda) {
        baseStyle.border = "1px solid #22c55e";
        baseStyle.background = "#ecfdf3";
      }
      if (isToday) {
        baseStyle.border = "1px solid #2563eb";
      }
      if (isSelected) {
        baseStyle.background = "#dbeafe";
      }

      days.push(
        <button
          key={iso}
          type="button"
          onClick={() => onSelectDate(iso)}
          style={{
            ...baseStyle,
            width: "100%",
          }}
          title={
            diaAgenda ? "Clique para ver as aulas deste dia" : undefined
          }
        >
          {format(cloneDay, "d")}
        </button>
      );

      day = addDays(day, 1);
    }

    rows.push(
      <div
        key={day.toISOString()}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
        }}
      >
        {days}
      </div>
    );
    days = [];
  }

  return <div>{rows}</div>;
}
