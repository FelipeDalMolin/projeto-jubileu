import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { LanceTimelineItem } from "../../../types/lanceTimeline";

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function typeVariant(tipo: string): "default" | "secondary" | "warning" | "danger" {
  const upper = tipo.toUpperCase();
  if (upper.includes("GOL")) return "default";
  if (upper.includes("FALTA")) return "warning";
  if (upper.includes("CARTAO") || upper.includes("PENAL")) return "danger";
  return "secondary";
}

export function TimelineLances({
  items,
  isLoading,
  error,
}: {
  items: LanceTimelineItem[];
  isLoading: boolean;
  error: string | null;
}) {
  function resolveDetalhe(item: LanceTimelineItem): string | null {
    const note = item.payload.note;
    if (typeof note === "string" && note.trim()) return note.trim();
    const detalhe = item.payload.detalhe;
    if (typeof detalhe === "string" && detalhe.trim()) return detalhe.trim();
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Timeline de Lances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Carregando timeline...</div>
        ) : null}
        {error ? <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        {!isLoading && !error && items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhum lance registrado ainda.
          </div>
        ) : null}
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const detalhe = resolveDetalhe(item);
            return (
              <div key={item.id} className="rounded-md border border-border bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant={typeVariant(item.tipo)}>{item.tipo}</Badge>
                  <span className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</span>
                </div>
                <div className="grid gap-1 text-sm">
                  <span>
                    Principal: <strong>{item.jogadorPrincipalNome ?? item.jogadorPrincipalId ?? "-"}</strong>
                  </span>
                  {item.jogadorSecundarioId || item.jogadorSecundarioNome ? (
                    <span>
                      Secundario:{" "}
                      <strong>{item.jogadorSecundarioNome ?? item.jogadorSecundarioId ?? "-"}</strong>
                    </span>
                  ) : null}
                  <span>
                    Time: <strong>{item.timeNome ?? item.timeId ?? "-"}</strong>
                  </span>
                  <span>
                    Minuto: <strong>{item.minute ?? "-"}</strong>
                  </span>
                  <span>
                    Autor: <strong>{item.author ?? "-"}</strong>
                  </span>
                  {detalhe ? (
                    <span>
                      Detalhe: <strong>{detalhe}</strong>
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
