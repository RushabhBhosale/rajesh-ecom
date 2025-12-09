"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  masterTypeLabels,
  masterTypes,
  type MasterOptionSummary,
  type MasterOptionType,
} from "@/lib/master-constants";

interface MasterTableProps {
  data: MasterOptionSummary[];
}

export function MasterTable({ data }: MasterTableProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<MasterOptionType | "all">("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const list = typeFilter === "all" ? data : data.filter((item) => item.type === typeFilter);
    return [...list].sort((a, b) => {
      if (a.type !== b.type) {
        return masterTypeLabels[a.type].localeCompare(masterTypeLabels[b.type]);
      }
      const orderA = typeof a.sortOrder === "number" ? a.sortOrder : 0;
      const orderB = typeof b.sortOrder === "number" ? b.sortOrder : 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [data, typeFilter]);

  function handleDelete(option: MasterOptionSummary) {
    const confirmed = window.confirm(
      `Delete ${option.name}? This will remove it from product selectors.`,
    );
    if (!confirmed) {
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch(`/api/masters/${option.id}`, { method: "DELETE" });
        if (!response.ok) {
          const res = await response.json().catch(() => null);
          const message = typeof res?.error === "string" ? res.error : "Unable to delete";
          toast.error(message);
          return;
        }
        toast.success(`${option.name} deleted`);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Unable to delete. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={typeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("all")}
        >
          All
        </Button>
        {masterTypes.map((type) => (
          <Button
            key={type}
            variant={typeFilter === type ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(type)}
          >
            {masterTypeLabels[type]}
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Sort</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No master options found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((option) => (
                <TableRow key={option.id}>
                  <TableCell className="font-medium">{masterTypeLabels[option.type]}</TableCell>
                  <TableCell>{option.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {option.description || "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {typeof option.sortOrder === "number" ? option.sortOrder : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/masters/${option.id}/edit`)}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(option)}
                        disabled={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
