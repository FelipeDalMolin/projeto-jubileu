import { ReactNode, useMemo, useState } from "react";
import { cn } from "../../../lib/utils";
import {
  ResponsiveTable,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../../ui/responsive-table";

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
    <ResponsiveTable>
        <TableHead>
          <TableRow>
            {columns.map((col) => {
              const active = sortKey === String(col.key);
              return (
                <TableHeaderCell
                  key={String(col.key)}
                  scope="col"
                  className={col.numeric ? "text-right" : "text-left"}
                >
                  <button
                    type="button"
                    className={cn(
                      "inline-flex w-full items-center gap-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      col.numeric && "justify-end text-right",
                    )}
                    onClick={() => toggleSort(String(col.key))}
                  >
                    {col.label}
                    <span className="text-[10px] text-slate-400" aria-hidden="true">
                      {active ? (direction === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </TableHeaderCell>
              );
            })}
          </TableRow>
        </TableHead>
        <tbody>
          {sorted.map((row, idx) => {
            const key = rowKey ? rowKey(row) : idx;
            const isActive = activeRowKey !== undefined && activeRowKey !== null && key === activeRowKey;
            return (
              <TableRow
                key={String(key)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  onRowClick && "cursor-pointer transition hover:bg-slate-50",
                  isActive && "bg-primary/5",
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={String(col.key)}
                    className={cn(col.numeric ? "text-right font-semibold" : "text-left")}
                  >
                    {col.render ? col.render(row) : renderValue(readValue(row, col.key))}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </tbody>
    </ResponsiveTable>
  );
}
