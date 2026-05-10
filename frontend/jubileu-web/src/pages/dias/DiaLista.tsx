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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);

  const navigate = useNavigate();

  // Carrega os dias (por enquanto usando listarDias → que chama a API dia a dia)
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const data = await listarDias();
        if (cancelado) return;

        const ordenados = [...data].sort((a, b) =>
          a.dataIso.localeCompare(b.dataIso),
        );
        setDias(ordenados);

        if (ordenados.length > 0 && !selectedDateIso) {
          setSelectedDateIso(ordenados[0].dataIso);
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
  }, [selectedDateIso]);

  // Mapa dataIso -> Dia
  const diasPorIso = useMemo(() => {
    const map = new Map<string, Dia>();
    for (const d of dias) {
      map.set(d.dataIso, d);
    }
    return map;
  }, [dias]);

  // Dias do mês atual que têm eventos/eventos
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
        <p>{erro}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Agenda de dias</h1>
      <p style={{ marginBottom: 16 }}>
        Use o calendário para navegar e selecione um dia para ver as eventos.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) minmax(280px, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Coluna esquerda: calendário */}
        <section>
          {/* Cabeçalho do mês */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <button
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

            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {monthLabel}
            </div>

            <button
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
              fontSize: 11,
              color: "#64748b",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          {/* Grade de dias */}
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDateIso={selectedDateIso}
            diasPorIso={diasPorIso}
            onSelectDate={(iso) => {
              // 🔥 Opção A: SEM CONDIÇÃO
              setSelectedDateIso(iso);
              navigate(`/dias/${iso}`);
            }}
          />
        </section>

        {/* Coluna direita: lista de dias do mês com eventos/eventos */}
        <section>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>
            Dias com eventos / eventos no mês
          </h2>

          {diasDoMesAtual.length === 0 ? (
            <p style={{ fontSize: 13, color: "#555" }}>
              Nenhuma evento ou evento cadastrado para este mês ainda.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {diasDoMesAtual.map((dia) => {
                const dateObj = parseISO(dia.dataIso);
                const titulo = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
                const semana = format(dateObj, "EEEE", { locale: ptBR });
                const totalEventos = dia.eventos.length;

                return (
                  <button
                    key={dia.dataIso}
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
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {titulo}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        textTransform: "capitalize",
                      }}
                    >
                      {semana}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      {totalEventos === 0
                        ? "Nenhuma evento planejada"
                        : `${totalEventos} evento(s) / evento(s)`}
                    </div>
                  </button>
                );
              })}
            </div>
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
          onClick={() => onSelectDate(iso)}
          style={{ ...baseStyle, width: "100%" }}
          title={
            diaAgenda
              ? "Clique para ver as eventos deste dia"
              : "Clique para abrir o dia (eventos ainda não cadastradas)"
          }
        >
          {format(cloneDay, "d")}
        </button>,
      );

      day = addDays(day, 1);
    }

    rows.push(
      <div
        key={day.toISOString()}
        style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
      >
        {days}
      </div>,
    );
    days = [];
  }

  return <div>{rows}</div>;
}
