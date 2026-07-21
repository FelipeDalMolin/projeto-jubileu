import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { PageHeader, PageShell, Toolbar } from "../../components/layout/PageShell";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/feedback";
import { SelectField } from "../../components/ui/form";
import { StatusBadge } from "../../components/ui/status-badge";
import { cn } from "../../lib/utils";
import { listarDias, ordenarEventosPorHorario } from "../../services/diasService";
import type { Dia, EventoDia, StatusEvento, TipoEventoModo } from "../../types/dia";

type TipoFiltro = "TODOS" | TipoEventoModo;
type StatusFiltro = "TODOS" | StatusEvento;

const TODAY_ISO = format(new Date(), "yyyy-MM-dd");

const TIPO_LABEL: Record<TipoEventoModo, string> = {
  AULA: "Aula",
  JOGO_LIVRE: "Jogo livre",
  OUTRO: "Outro",
};

export default function DiaLista() {
  const [dias, setDias] = useState<Dia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateIso, setSelectedDateIso] = useState<string>(TODAY_ISO);
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("TODOS");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("TODOS");

  const navigate = useNavigate();

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const data = await listarDias();
        if (cancelado) return;
        setDias([...data].sort((a, b) => a.dataIso.localeCompare(b.dataIso)));
      } catch (e) {
        console.error("Erro ao carregar dias:", e);
        if (!cancelado) {
          setErro("Nao foi possivel carregar os dias.");
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, []);

  const eventosFiltradosPorIso = useMemo(() => {
    const map = new Map<string, EventoDia[]>();
    for (const dia of dias) {
      const eventos = ordenarEventosPorHorario(dia.eventos).filter((evento) => {
        const matchTipo = tipoFiltro === "TODOS" || evento.tipo === tipoFiltro;
        const matchStatus = statusFiltro === "TODOS" || evento.status === statusFiltro;
        return matchTipo && matchStatus;
      });
      map.set(dia.dataIso, eventos);
    }
    return map;
  }, [dias, tipoFiltro, statusFiltro]);

  const eventosDoMes = useMemo(() => {
    return dias.flatMap((dia) => {
      const date = parseISO(dia.dataIso);
      if (date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear()) {
        return [];
      }
      return (eventosFiltradosPorIso.get(dia.dataIso) ?? []).map((evento) => ({ dia, evento }));
    });
  }, [dias, currentMonth, eventosFiltradosPorIso]);

  const eventosDoDiaSelecionado = eventosFiltradosPorIso.get(selectedDateIso) ?? [];
  const selectedDate = parseISO(selectedDateIso);
  const monthLabel = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

  if (loading) {
    return (
      <PageShell data-testid="page-calendario">
        <PageHeader title="Calendario" description="Entrada operacional para dias e eventos." />
        <LoadingState label="Carregando calendario..." />
      </PageShell>
    );
  }

  return (
    <PageShell data-testid="page-calendario">
      <PageHeader
        title="Calendario"
        description="Dia e contexto temporal; evento e a unidade operacional."
        actions={
          <Button type="button" size="sm" onClick={() => navigate(`/dias/${selectedDateIso}`)}>
            Abrir dia selecionado
          </Button>
        }
      />

      {erro ? <ErrorState message={erro} /> : null}

      <Card>
        <CardContent className="grid gap-3 pt-4 md:grid-cols-3">
          <SelectField label="Tipo de evento" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}>
            <option value="TODOS">Todos</option>
            <option value="AULA">Aula</option>
            <option value="JOGO_LIVRE">Jogo livre</option>
            <option value="OUTRO">Outro</option>
          </SelectField>
          <SelectField label="Status" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}>
            <option value="TODOS">Todos</option>
            <option value="PLANEJADO">Planejado</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="ENCERRADO">Encerrado</option>
            <option value="CANCELADO">Cancelado</option>
          </SelectField>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setTipoFiltro("TODOS");
                setStatusFiltro("TODOS");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="capitalize">{monthLabel}</CardTitle>
              <CardDescription>{eventosDoMes.length} evento(s) no mes com os filtros atuais.</CardDescription>
            </div>
            <Toolbar>
              <Button type="button" variant="outline" size="sm" onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}>
                Mes anterior
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Hoje
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}>
                Proximo mes
              </Button>
            </Toolbar>
          </CardHeader>
          <CardContent>
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDateIso={selectedDateIso}
              eventosPorIso={eventosFiltradosPorIso}
              onSelectDate={(iso) => setSelectedDateIso(iso)}
              onOpenDia={(iso) => navigate(`/dias/${iso}`)}
              onOpenEvento={(dataIso, eventoId) => navigate(`/dias/${dataIso}/eventos/${eventoId}`)}
            />
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</CardTitle>
              <CardDescription>{format(selectedDate, "EEEE", { locale: ptBR })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate(`/dias/${selectedDateIso}`)}>
                Abrir dia
              </Button>

              {eventosDoDiaSelecionado.length === 0 ? (
                <EmptyState title="Sem eventos no filtro" description="Abra o dia para criar ou ajustar eventos." />
              ) : (
                <div className="space-y-2">
                  {eventosDoDiaSelecionado.map((evento) => (
                    <EventCard
                      key={evento.id}
                      diaIso={selectedDateIso}
                      evento={evento}
                      onOpen={() => navigate(`/dias/${selectedDateIso}/eventos/${evento.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agenda do mes</CardTitle>
              <CardDescription>Eventos filtrados, ordenados por data e horario.</CardDescription>
            </CardHeader>
            <CardContent>
              {eventosDoMes.length === 0 ? (
                <EmptyState title="Nenhum evento encontrado" description="Ajuste os filtros ou navegue para outro mes." />
              ) : (
                <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                  {eventosDoMes.map(({ dia, evento }) => (
                    <EventCard
                      key={`${dia.dataIso}-${evento.id}`}
                      diaIso={dia.dataIso}
                      evento={evento}
                      compact
                      onOpen={() => navigate(`/dias/${dia.dataIso}/eventos/${evento.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </PageShell>
  );
}

type CalendarGridProps = {
  currentMonth: Date;
  selectedDateIso: string;
  eventosPorIso: Map<string, EventoDia[]>;
  onSelectDate: (iso: string) => void;
  onOpenDia: (iso: string) => void;
  onOpenEvento: (dataIso: string, eventoId: string) => void;
};

function CalendarGrid({ currentMonth, selectedDateIso, eventosPorIso, onSelectDate, onOpenDia, onOpenEvento }: CalendarGridProps) {
  const today = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const cells: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    cells.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-normal text-slate-500">
        <div>Seg</div>
        <div>Ter</div>
        <div>Qua</div>
        <div>Qui</div>
        <div>Sex</div>
        <div>Sab</div>
        <div>Dom</div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cellDate) => {
          const iso = format(cellDate, "yyyy-MM-dd");
          const eventos = eventosPorIso.get(iso) ?? [];
          const current = isSameMonth(cellDate, monthStart);
          const todayCell = isSameDay(cellDate, today);
          const selected = selectedDateIso === iso;

          return (
            <div
              key={iso}
              className={cn(
                "min-h-[92px] rounded-md border bg-white p-1.5 transition",
                current ? "border-slate-200" : "border-slate-100 bg-slate-50 text-slate-400",
                selected ? "border-primary ring-2 ring-primary/20" : "",
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <button
                  type="button"
                  data-testid={`cal-dia-${iso}`}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold",
                    todayCell ? "bg-primary text-white" : "text-slate-800 hover:bg-slate-100",
                    !current && !todayCell ? "text-slate-400" : "",
                  )}
                  onClick={() => onSelectDate(iso)}
                  onDoubleClick={() => onOpenDia(iso)}
                  title="Selecionar dia"
                >
                  {format(cellDate, "d")}
                </button>
                {eventos.length > 0 ? (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {eventos.length}
                  </span>
                ) : null}
              </div>

              <EventDots eventos={eventos} dataIso={iso} onOpenEvento={onOpenEvento} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventDots({
  eventos,
  dataIso,
  onOpenEvento,
}: {
  eventos: EventoDia[];
  dataIso: string;
  onOpenEvento: (dataIso: string, eventoId: string) => void;
}) {
  const visible = eventos.slice(0, 4);
  const extra = eventos.length - visible.length;

  if (eventos.length === 0) {
    return <div className="mt-4 h-5" aria-hidden />;
  }

  return (
    <div className="mt-3 flex min-h-5 flex-wrap items-center gap-1">
      {visible.map((evento) => (
        <button
          key={evento.id}
          type="button"
          className={cn("h-3 w-3 rounded-full border", eventDotClasses(evento))}
          title={`${TIPO_LABEL[evento.tipo]} - ${evento.horarioInicio || "sem horario"}`}
          aria-label={`Abrir ${TIPO_LABEL[evento.tipo]} em ${dataIso}`}
          onClick={() => onOpenEvento(dataIso, evento.id)}
        />
      ))}
      {extra > 0 ? <span className="text-[10px] font-medium text-slate-500">+{extra}</span> : null}
    </div>
  );
}

function EventCard({
  diaIso,
  evento,
  onOpen,
  compact = false,
}: {
  diaIso: string;
  evento: EventoDia;
  onOpen: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className="w-full rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-primary/40 hover:bg-slate-50"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={evento.tipo === "AULA" ? "default" : evento.tipo === "JOGO_LIVRE" ? "success" : "outline"}>
              {TIPO_LABEL[evento.tipo]}
            </Badge>
            <StatusBadge value={evento.status} />
          </div>
          <h3 className="mt-2 font-semibold text-slate-950">
            {evento.turmaNome ?? TIPO_LABEL[evento.tipo]}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {compact ? `${format(parseISO(diaIso), "dd/MM", { locale: ptBR })} - ` : ""}
            {evento.horarioInicio || "--:--"} - {evento.horarioFim || "--:--"}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-primary">Abrir</span>
      </div>
      {!compact ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
          <span>{evento.jogadores.length} jogador(es)</span>
          <span>{evento.partidasCount} partida(s)</span>
        </div>
      ) : null}
    </button>
  );
}

function eventDotClasses(evento: EventoDia) {
  if (evento.status === "CANCELADO") return "border-slate-300 bg-slate-200";
  if (evento.status === "ENCERRADO") return "border-slate-400 bg-white";
  if (evento.status === "EM_ANDAMENTO") return "border-emerald-600 bg-emerald-500";
  if (evento.tipo === "JOGO_LIVRE") return "border-emerald-500 bg-white";
  if (evento.tipo === "OUTRO") return "border-amber-500 bg-white";
  return "border-primary bg-white";
}
