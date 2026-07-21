import { useState } from "react";
import type * as React from "react";
import { cn } from "../../lib/utils";

export type TabsItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
}: {
  items: TabsItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalActive, setInternalActive] = useState(defaultValue ?? items[0]?.id ?? "");
  const active = value ?? internalActive;

  if (!items.length) return null;

  return (
    <div className="w-full">
      <div className="mb-4 flex max-w-full gap-1 overflow-x-auto rounded-md border border-border bg-white p-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (!value) setInternalActive(item.id);
              onValueChange?.(item.id);
            }}
            className={cn(
              "shrink-0 rounded-sm px-3 py-1.5 text-sm",
              active === item.id
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-slate-50",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{items.find((item) => item.id === active)?.content}</div>
    </div>
  );
}
