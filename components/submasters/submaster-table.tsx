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
  type MasterOptionType,
} from "@/lib/master-constants";
import type { SubMasterOptionSummary } from "@/lib/submaster-constants";

interface SubMasterTableProps {
  data: SubMasterOptionSummary[];
}

export function SubMasterTable({ data }: SubMasterTableProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<MasterOptionType | "all">("all");
  const [masterFilter, setMasterFilter] = useState<string | "all">("all");
  const [isPending, startTransition] = useTransition();

  const masterOptions = useMemo(() => {
    const lookup = new Map<string, { name: string; type: MasterOptionType }>();
    data.forEach((item) => {
      lookup.set(item.masterId, { name: item.masterName, type: item.masterType });
    });
    return Array.from(lookup.entries())
      .map(([id, meta]) => ({ id, ...meta }))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return masterTypeLabels[a.type].localeCompare(masterTypeLabels[b.type]);
        }
        return a.name.localeCompare(b.name);
      });
  }, [data]);

  const filtered = useMemo(() => {
    const list =
      typeFilter === "all" ? data : data.filter((item) => item.masterType === typeFilter);
    const scoped =
      masterFilter === "all" ? list : list.filter((item) => item.masterId === masterFilter);

    return [...scoped].sort((a, b) => {
      if (a.masterType !== b.masterType) {
        return masterTypeLabels[a.masterType].localeCompare(masterTypeLabels[b.masterType]);
      }
      if (a.masterName !== b.masterName) {
        return a.masterName.localeCompare(b.masterName);
      }
      const orderA = typeof a.sortOrder === "number" ? a.sortOrder : 0;
      const orderB = typeof b.sortOrder === "number" ? b.sortOrder : 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [data, masterFilter, typeFilter]);
  const parentLookup = useMemo(() => {
    const map = new Map<string, SubMasterOptionSummary>();
    data.forEach((item) => {
      map.set(item.id, item);
    });
    const pathCache = new Map<string, string>();
    const buildPath = (node: SubMasterOptionSummary): string => {
      if (pathCache.has(node.id)) {
        return pathCache.get(node.id)!;
      }
      const seen = new Set<string>();
      const parts = [node.name];
      let current: SubMasterOptionSummary | undefined = node;
      while (current?.parentId) {
        if (seen.has(current.parentId)) break;
        seen.add(current.parentId);
        const parent = map.get(current.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        current = parent;
      }
      parts.unshift(node.masterName);
      const path = parts.filter(Boolean).join(" / ");
      pathCache.set(node.id, path);
      return path;
    };
    return { map, buildPath };
  }, [data]);

  function handleDelete(option: SubMasterOptionSummary) {
    const confirmed = window.confirm(
      `Delete ${option.name}? This will remove it from selectors under ${option.masterName}.`,
    );
    if (!confirmed) {
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch(`/api/submasters/${option.id}`, { method: "DELETE" });
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
          All types
        </Button>
        {masterTypes.map((type) => (
          <Button
            key={type}
            variant={typeFilter === type ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTypeFilter(type);
              setMasterFilter("all");
            }}
          >
            {masterTypeLabels[type]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Parent filter:</span>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          value={masterFilter}
          onChange={(event) => setMasterFilter(event.target.value || "all")}
          disabled={masterOptions.length === 0}
        >
          <option value="all">All masters</option>
          {masterOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {masterTypeLabels[option.type]} — {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Sort</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No submasters found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((option) => (
                <TableRow key={option.id}>
                  <TableCell className="font-medium">
                    {masterTypeLabels[option.masterType]}
                  </TableCell>
                  <TableCell>{parentLookup.buildPath(option)}</TableCell>
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
                        onClick={() => router.push(`/admin/submasters/${option.id}/edit`)}
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
