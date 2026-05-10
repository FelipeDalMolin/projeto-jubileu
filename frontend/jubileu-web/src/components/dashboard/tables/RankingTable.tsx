import { ReactNode, useMemo, useState } from "react";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  numeric?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string | number;
  activeRowKey?: string | number | null;
};

type SortDirection = "asc" | "desc";

function readValue<T extends Record<string, unknown>>(row: T, key: keyof T | string): unknown {
  return row[key as keyof T];
}

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return value;
  return String(value);
}

export default function RankingTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  rowKey,
  activeRowKey,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string>(String(columns[0]?.key ?? ""));
  const [direction, setDirection] = useState<SortDirection>("desc");

  const sorted = useMemo(() => {
    const col = columns.find((c) => String(c.key) === sortKey);
    if (!col) return data;

    const sortedCopy = [...data].sort((a, b) => {
      const av = readValue(a, col.key);
      const bv = readValue(b, col.key);

      if (typeof av === "number" && typeof bv === "number") {
        return av - bv;
      }

      return String(av ?? "").localeCompare(String(bv ?? ""), "pt-BR", { sensitivity: "base" });
    });

    return direction === "asc" ? sortedCopy : sortedCopy.reverse();
  }, [data, direction, sortKey, columns]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((col) => {
              const active = sortKey === String(col.key);
              return (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={col.numeric ? "text-end" : "text-start"}
                  role="button"
                  onClick={() => toggleSort(String(col.key))}
                >
                  <span className="d-inline-flex align-items-center gap-1">
                    {col.label}
                    <small className="text-muted">
                      {active ? (direction === "asc" ? "▲" : "▼") : "↕"}
                    </small>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => {
            const key = rowKey ? rowKey(row) : idx;
            const isActive = activeRowKey !== undefined && activeRowKey !== null && key === activeRowKey;
            return (
              <tr
                key={String(key)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`${col.numeric ? "text-end fw-semibold" : "text-start"} ${
                      isActive ? "table-active" : ""
                    }`}
                  >
                    {col.render ? col.render(row) : renderValue(readValue(row, col.key))}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
