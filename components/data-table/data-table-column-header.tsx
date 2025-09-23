"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  align?: "left" | "center" | "right";
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  align = "left",
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();

  if (!column.getCanSort()) {
    return (
      <span className={cn("text-xs font-semibold uppercase tracking-wide text-muted-foreground", align === "center" && "text-center", align === "right" && "text-right")}>
        {title}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground",
        align === "center" && "justify-center text-center",
        align === "right" && "justify-end text-right",
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>
      {sorted === "asc" ? (
        <ArrowUp className="ml-2 h-3.5 w-3.5" aria-hidden />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-2 h-3.5 w-3.5" aria-hidden />
      ) : (
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" aria-hidden />
      )}
    </Button>
  );
}
