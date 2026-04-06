import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
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
          {items.map((item) => (
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
              </div>
              <Separator className="my-2" />
              <pre className="overflow-x-auto text-[11px] text-muted-foreground">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
