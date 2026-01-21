import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { WorkspaceAulaHeader, WorkspaceAulaMeta } from "../../types/workspaceAula";

type Props = {
  meta: WorkspaceAulaMeta;
  header: WorkspaceAulaHeader;
};

function formatData(dataIso: string) {
  try {
    const dataObj = parseISO(dataIso);
    return format(dataObj, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dataIso;
  }
}

export default function WorkspaceHeader({ meta, header }: Props) {
  return (
    <div className="mb-3">
      <h2 className="mb-1">Dia {formatData(meta.data_iso)}</h2>
      <h1 className="h4 mb-1">{header.titulo}</h1>
      <p className="text-muted mb-2">
        {header.horario_inicio} - {header.horario_fim}
      </p>
      <p className="text-muted mb-0" style={{ fontSize: 12 }}>
        Status: {meta.status} - Tipo: {meta.tipo}
      </p>
    </div>
  );
}
