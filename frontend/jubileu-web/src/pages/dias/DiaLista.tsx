// src/pages/dias/DiaLista.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarDias } from "../../services/diasService";
import type { Dia } from "../../types/dia";
import type { CSSProperties, ReactNode } from "react";
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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    listarDias()
      .then((data) => {
        const ordenados = [...data].sort((a, b) =>
          a.dataIso.localeCompare(b.dataIso)
        );
        setDias(ordenados);

        if (ordenados.length > 0) {
          setSelectedDateIso(ordenados[0].dataIso);

          // se o primeiro dia não for do mês atual, já ajusta o calendário
          const firstDate = parseISO(ordenados[0].dataIso);
          setCurrentMonth(firstDate);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const diasPorIso = useMemo(() => {
    const map = new Map<string, Dia>();
    for (const d of dias) {
      map.set(d.dataIso, d);
    }
    return map;
  }, [dias]);

  // dias do mês atual que têm aulas / eventos
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

  if (loading) {
    return <div className="page-container">Carregando dias...</div>;
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-header-title">Agenda de dias</h1>
          <p className="page-header-subtitle">
            Use o calendário para navegar e selecione um dia para ver as aulas.
          </p>
        </div>
      </header>

      {/* CALENDÁRIO + CONTROLES DE MÊS */}
      <section className="card" style={{ marginTop: 16, marginBottom: 24, maxWidth: 480 }}>
        {/* Cabeçalho do mês */}
        <div
          className="card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
          >
            &larr; Mês anterior
          </button>

          <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
            {monthLabel}
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          >
            Próximo mês &rarr;
          </button>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 600,
            color: "#555",
            marginBottom: 4,
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
          onSelectDate={(iso) => {
            setSelectedDateIso(iso);
            // se já houver algo planejado nesse dia, já vai pro detalhe
            if (diasPorIso.has(iso)) {
              navigate(`/dias/${iso}`);
            }
          }}
          diasPorIso={diasPorIso}
        />
      </section>

      {/* LISTA DOS DIAS DO MÊS ATUAL COM AULAS/EVENTOS */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Dias com aulas / eventos no mês</h2>
        </div>
        {diasDoMesAtual.length === 0 ? (
          <p className="page-header-subtitle">
            Nenhuma aula ou evento cadastrado para este mês ainda.
          </p>
        ) : (
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {diasDoMesAtual.map((dia) => {
              const dateObj = parseISO(dia.dataIso);
              const titulo = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
              const semana = format(dateObj, "EEEE", { locale: ptBR });
              const totalAulas = dia.aulas.length;

              return (
                <button
                  key={dia.dataIso}
                  className="card btn btn-ghost"
                  onClick={() => navigate(`/dias/${dia.dataIso}`)}
                  style={{ textAlign: "left" }}
                >
                  <div className="card-title" style={{ marginBottom: 4 }}>
                    {titulo}
                  </div>
                  <div
                    className="card-subtitle"
                    style={{ textTransform: "capitalize" }}
                  >
                    {semana}
                  </div>

                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    {totalAulas === 0
                      ? "Nenhuma aula planejada"
                      : `${totalAulas} aula(s) / evento(s)`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
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
        <div
          key={iso}
          style={baseStyle}
          onClick={() => onSelectDate(iso)}
          title={diaAgenda ? "Clique para ver as aulas deste dia" : undefined}
        >
          {format(cloneDay, "d")}
        </div>
      );

      day = addDays(day, 1);
    }

    rows.push(
      <div
        key={format(day, "yyyy-MM-dd") + "-row"}
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
