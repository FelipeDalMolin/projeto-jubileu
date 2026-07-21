import { Badge } from "./badge";

type StatusBadgeProps = {
  value: string | null | undefined;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function label(value: string | null | undefined) {
  const raw = value ?? "indefinido";
  return raw
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const status = normalize(value);
  const variant =
    status.includes("cancel") || status.includes("inativo") || status.includes("afastado")
      ? "danger"
      : status.includes("andamento") || status.includes("ativo") || status.includes("checked")
        ? "success"
        : status.includes("lesionado") || status.includes("planejado") || status.includes("rsvp")
          ? "warning"
          : "outline";

  return <Badge variant={variant}>{label(value)}</Badge>;
}
