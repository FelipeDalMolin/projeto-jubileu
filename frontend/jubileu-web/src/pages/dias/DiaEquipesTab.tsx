import { useMemo, useState } from "react";
import DiaCard, { type DiaResumo } from "../../components/dias/DiaCard";

type FiltrosDias = {
  ano?: string;
  mes?: string;
  turma?: string;
  somenteTreinoCancelado?: boolean;
};

type DiaCalendario = {
  label: string;
  isoDate?: string;
};

// MOCK – depois vamos buscar da API
const MOCK_DIAS: DiaResumo[] = [
  {
    id: 1,
    data: "2025-11-20",
    turmas: ["Sub-11", "Adulto", "Feminino", "Veteranos", "Juvenil"],
    totalEquipes: 10,
    totalPartidas: 8,
    totalGols: 18,
    totalChiliques: 2,
    treinoCancelado: false,
  },
  {
    id: 2,
    data: "2025-11-22",
    turmas: ["Adulto"],
    totalEquipes: 4,
    totalPartidas: 6,
    totalGols: 25,
    totalChiliques: 5,
    treinoCancelado: true,
  },
  {
    id: 3,
    data: "2025-12-03",
    turmas: ["Sub-13", "Sub-15"],
    totalEquipes: 6,
    totalPartidas: 5,
    totalGols: 14,
    totalChiliques: 1,
    treinoCancelado: false,
  },
];

function filtrarDias(dias: DiaResumo[], filtros: FiltrosDias): DiaResumo[] {
  return dias.filter((d) => {
    // filtro por ano/mês (calendário)
    if (filtros.ano || filtros.mes) {
      const [anoDoDia, mesDoDia] = d.data.split("-");
      if (filtros.ano && filtros.ano !== anoDoDia) return false;
      if (filtros.mes && filtros.mes !== mesDoDia) return false;
    }

    // filtro por turma
    if (filtros.turma) {
      const atendeTurma = d.turmas.some((turma) =>
        turma.toLowerCase().includes(filtros.turma!.toLowerCase())
      );

      if (!atendeTurma) return false;
    }

    // filtro por treino cancelado
    if (filtros.somenteTreinoCancelado && !d.treinoCancelado) {
      return false;
    }

    return true;
  });
}

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

const MESES: { value: string; label: string }[] = Array.from(
  { length: 12 },
  (_, index) => {
    const value = pad2(index + 1);
    const label = new Date(0, index).toLocaleString("pt-BR", { month: "long" });
    const labelCapitalizada = label.charAt(0).toUpperCase() + label.slice(1);

    return { value, label: labelCapitalizada };
  }
);

const DIAS_SEMANA: string[] = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function criarDiasCalendario(ano: number, mes: number): DiaCalendario[] {
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);
  const dias: DiaCalendario[] = [];

  // preencher com espaços em branco antes do primeiro dia
  for (let i = 0; i < primeiroDia.getDay(); i += 1) {
    dias.push({ label: "" });
  }

  // preencher os dias do mês
  for (let dia = 1; dia <= ultimoDia.getDate(); dia += 1) {
    const isoDate = `${ano}-${pad2(mes)}-${pad2(dia)}`;
    dias.push({ label: dia.toString(), isoDate });
  }

  return dias;
}

const hoje = new Date();
const anoAtual = hoje.getFullYear();
const mesAtual = pad2(hoje.getMonth() + 1);
const dataPadrao = `${anoAtual}-${mesAtual}-01`;
const [anoPadrao, mesPadrao] = (MOCK_DIAS[0]?.data ?? dataPadrao).split("-");

export default function DiaLista() {
  const [dias, setDias] = useState<DiaResumo[]>(MOCK_DIAS);
  const [filtros, setFiltros] = useState<FiltrosDias>({
    ano: anoPadrao,
    mes: mesPadrao,
  });

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    anos.add(anoAtual.toString());

    dias.forEach((dia) => anos.add(dia.data.slice(0, 4)));
    if (filtros.ano) anos.add(filtros.ano);

    return Array.from(anos).sort((a, b) => Number(a) - Number(b));
  }, [dias, filtros.ano]);

  const selectedYear =
    filtros.ano || anosDisponiveis[0] || anoPadrao || anoAtual.toString();
  const selectedMonth = filtros.mes || mesPadrao || mesAtual;
  const anoReferencia = Number(selectedYear) || anoAtual;
  const mesReferencia = Number(selectedMonth) || Number(mesAtual);

  const mesSelecionadoLabel = useMemo(
    () => MESES.find((mes) => mes.value === selectedMonth)?.label ?? "Mês",
    [selectedMonth]
  );

  const diasFiltrados = filtrarDias(dias, filtros);
  const diasDoMesSelecionado = filtrarDias(dias, {
    ...filtros,
    ano: selectedYear,
    mes: selectedMonth,
  });

  const diasCalendario = useMemo(
    () => criarDiasCalendario(anoReferencia, mesReferencia),
    [anoReferencia, mesReferencia]
  );

  const diasComJogos = useMemo(
    () => new Set(diasDoMesSelecionado.map((dia) => dia.data)),
    [diasDoMesSelecionado]
  );

  function alterarMes(delta: number) {
    const referencia = new Date(anoReferencia, mesReferencia - 1, 1);
    referencia.setMonth(referencia.getMonth() + delta);

    const novoAno = referencia.getFullYear().toString();
    const novoMes = pad2(referencia.getMonth() + 1);

    setFiltros((prev) => ({ ...prev, ano: novoAno, mes: novoMes }));
  }

  function handleAddDia(isoDate: string) {
    const entradaTurmas = prompt(
      `Adicionar ou complementar o dia ${isoDate}\nInforme as turmas separadas por vírgula:`
    );

    if (!entradaTurmas) return;

    const novasTurmas = entradaTurmas
      .split(",")
      .map((turma) => turma.trim())
      .filter(Boolean);

    if (novasTurmas.length === 0) return;

    setDias((listaAtual) => {
      const indiceExistente = listaAtual.findIndex(
        (dia) => dia.data === isoDate
      );

      if (indiceExistente >= 0) {
        const existente = listaAtual[indiceExistente];
        const turmasAtualizadas = Array.from(
          new Set([...existente.turmas, ...novasTurmas])
        );

        const atualizado: DiaResumo = {
          ...existente,
          turmas: turmasAtualizadas,
          totalEquipes: Math.max(2, turmasAtualizadas.length * 2),
        };

        return [
          ...listaAtual.slice(0, indiceExistente),
          atualizado,
          ...listaAtual.slice(indiceExistente + 1),
        ];
      }

      const maiorId = listaAtual.reduce((max, dia) => Math.max(max, dia.id), 0);

      return [
        ...listaAtual,
        {
          id: maiorId + 1,
          data: isoDate,
          turmas: novasTurmas,
          totalEquipes: Math.max(2, novasTurmas.length * 2),
          totalPartidas: 0,
          totalGols: 0,
          totalChiliques: 0,
          treinoCancelado: false,
        },
      ].sort((a, b) => a.data.localeCompare(b.data));
    });
  }

  function handleNovoDia() {
    const dataDigitada = prompt(
      "Qual a data do novo dia? (AAAA-MM-DD)",
      `${selectedYear}-${selectedMonth}-01`
    );

    if (!dataDigitada) return;

    const formatoValido = /^\d{4}-\d{2}-\d{2}$/;

    if (!formatoValido.test(dataDigitada)) {
      alert("Use o formato AAAA-MM-DD para cadastrar a data.");
      return;
    }

    handleAddDia(dataDigitada);
  }

  function limparFiltros() {
    setFiltros({});
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Dias de Jogo</h2>

      {/* Barra de filtros no topo */}
      <div
        style={{
          marginTop: 12,
          marginBottom: 16,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Ano</label>
          <select
            value={selectedYear}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                ano: e.target.value || undefined,
              }))
            }
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Mês</label>
          <select
            value={selectedMonth}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                mes: e.target.value || undefined,
              }))
            }
          >
            {MESES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Turma</label>
          <input
            type="text"
            placeholder="Sub-11, Adulto..."
            value={filtros.turma || ""}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                turma: e.target.value || undefined,
              }))
            }
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: 12 }}>Só treino cancelado (X)</label>
          <input
            type="checkbox"
            checked={filtros.somenteTreinoCancelado || false}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                somenteTreinoCancelado: e.target.checked || undefined,
              }))
            }
          />
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={limparFiltros}>Limpar filtros</button>
          <button onClick={handleNovoDia}>+ Novo dia</button>
        </div>
      </div>

      {/* Calendário do mês selecionado */}
      <div
        style={{
          marginTop: 12,
          marginBottom: 16,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Calendário</p>
            <h3 style={{ margin: 0 }}>
              {`${mesSelecionadoLabel} de ${selectedYear}`}
            </h3>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#475569",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              Dia de jogo encontrado
            </span>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => alterarMes(-1)} aria-label="Mês anterior">
                ← Mês anterior
              </button>
              <button onClick={() => alterarMes(1)} aria-label="Próximo mês">
                Próximo mês →
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
            textAlign: "center",
            fontSize: 12,
            color: "#475569",
          }}
        >
          {DIAS_SEMANA.map((dia) => (
            <strong key={dia}>{dia}</strong>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
            marginTop: 8,
          }}
        >
          {diasCalendario.map(({ label, isoDate }, index) => {
            const temJogo = isoDate && diasComJogos.has(isoDate);
            const diaDetalhado = isoDate
              ? diasDoMesSelecionado.find((dia) => dia.data === isoDate)
              : undefined;
            const turmasPreview = diaDetalhado?.turmas.slice(0, 2).join(", ");
            const turmasExtras =
              diaDetalhado && diaDetalhado.turmas.length > 2
                ? `+${diaDetalhado.turmas.length - 2}`
                : "";

            return (
              <div
                key={`${label}-${index}`}
                style={{
                  height: 68,
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: temJogo ? "#ecfdf3" : "#f8fafc",
                  color: temJogo ? "#166534" : "#0f172a",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  padding: 8,
                  gap: 6,
                  position: "relative",
                  fontWeight: 600,
                  cursor: isoDate ? "pointer" : "default",
                }}
                onClick={() => isoDate && handleAddDia(isoDate)}
                title={
                  isoDate
                    ? "Clique para adicionar turmas ou registrar um dia"
                    : undefined
                }
              >
                <span>{label}</span>
                {temJogo && (
                  <span
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: "#22c55e",
                    }}
                    title="Dia com jogo"
                  />
                )}

                {diaDetalhado && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      textAlign: "left",
                      lineHeight: 1.2,
                      color: "#0f172a",
                      fontWeight: 500,
                    }}
                  >
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "2px 6px",
                          borderRadius: 999,
                          background: "#e0f2fe",
                          color: "#075985",
                          border: "1px solid #bae6fd",
                        }}
                      >
                        {diaDetalhado.turmas.length} turmas
                      </span>
                    </div>
                    {turmasPreview && (
                      <div style={{ marginTop: 4, color: "#334155" }}>
                        {turmasPreview}{" "}
                        {turmasExtras && <strong>{turmasExtras}</strong>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid de cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {diasFiltrados.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 10,
              padding: 24,
              textAlign: "center",
              color: "#475569",
            }}
          >
            Nenhum dia encontrado para esse filtro. Ajuste o ano/mês ou remova
            restrições de turma.
          </div>
        ) : (
          diasFiltrados.map((dia) => <DiaCard key={dia.id} dia={dia} />)
        )}
      </div>
    </div>
  );
}
