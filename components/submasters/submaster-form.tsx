"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  masterTypeLabels,
  type MasterOptionSummary,
} from "@/lib/master-constants";
import type { SubMasterOptionSummary } from "@/lib/submaster-constants";

interface SubMasterFormProps {
  mode: "create" | "edit";
  masters: MasterOptionSummary[];
  initialData?: SubMasterOptionSummary;
  initialMasterId?: string;
}

type RowState = {
  id: string;
  masterId: string;
  name: string;
  description: string;
  sortOrder: string;
  error: string | null;
};

export function SubMasterForm({
  mode,
  masters,
  initialData,
  initialMasterId,
}: SubMasterFormProps) {
  const router = useRouter();

  const sortedMasters = useMemo(() => {
    return [...masters].sort((a, b) => {
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
  }, [masters]);

  const fallbackMasterId = initialData?.masterId ?? initialMasterId ?? sortedMasters[0]?.id ?? "";

  const [rows, setRows] = useState<RowState[]>(() => {
    if (initialData) {
      return [
        {
          id: initialData.id,
          masterId: initialData.masterId,
          name: initialData.name,
          description: initialData.description ?? "",
          sortOrder:
            typeof initialData.sortOrder === "number" ? String(initialData.sortOrder) : "",
          error: null,
        },
      ];
    }
    return [
      {
        id: "row-1",
        masterId: fallbackMasterId,
        name: "",
        description: "",
        sortOrder: "",
        error: null,
      },
    ];
  });

  const [isPending, startTransition] = useTransition();
  const allowMultiple = mode === "create";
  const hasMasters = sortedMasters.length > 0;

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${prev.length + 1}-${Date.now()}`,
        masterId: prev[prev.length - 1]?.masterId || sortedMasters[0]?.id || "",
        name: "",
        description: "",
        sortOrder: "",
        error: null,
      },
    ]);
  }

  function updateRow(
    id: string,
    field: "masterId" | "name" | "description" | "sortOrder",
    value: string,
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
              error: field === "name" || field === "masterId" ? null : row.error,
            }
          : row,
      ),
    );
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  }

  const heading = useMemo(
    () => (mode === "edit" ? "Edit submaster" : "Add submasters"),
    [mode],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasMasters) {
      toast.error("Add a master option before creating submasters.");
      return;
    }

    const nextRows = [...rows];
    let hasError = false;
    const payloads: Array<{
      masterId: string;
      name: string;
      description: string;
      sortOrder: number;
    }> = [];

    nextRows.forEach((row, index) => {
      const trimmedName = row.name.trim();
      const selectedMaster = row.masterId.trim();
      let error: string | null = null;

      if (!trimmedName && allowMultiple) {
        // Skip empty rows in multi-create mode.
        return;
      }

      if (!trimmedName) {
        error = "Name is required.";
      }

      if (!selectedMaster) {
        error = "Select a parent master.";
      }

      if (row.sortOrder) {
        const parsed = Number.parseInt(row.sortOrder, 10);
        if (Number.isNaN(parsed) || parsed < 0) {
          error = "Sort order must be a positive integer.";
        }
      }

      if (error) {
        hasError = true;
        nextRows[index] = { ...row, error };
        return;
      }

      payloads.push({
        masterId: selectedMaster,
        name: trimmedName,
        description: row.description.trim(),
        sortOrder: row.sortOrder ? Number.parseInt(row.sortOrder, 10) : 0,
      });
    });

    if (!payloads.length) {
      toast.error("Add at least one submaster with a name.");
      setRows(nextRows);
      return;
    }

    if (hasError) {
      toast.error("Please fix the highlighted rows.");
      setRows(nextRows);
      return;
    }

    setRows(nextRows);

    startTransition(async () => {
      try {
        if (mode === "edit" && initialData?.id) {
          const [payload] = payloads;
          const response = await fetch(`/api/submasters/${initialData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => null);
            const message =
              typeof data?.error === "string" ? data.error : "Unable to update submaster.";
            toast.error(message);
            return;
          }

          toast.success("Submaster updated successfully");
        } else {
          const results = await Promise.all(
            payloads.map(async (payload) => {
              const response = await fetch("/api/submasters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const ok = response.ok;
              const message = await response
                .json()
                .catch(() => (ok ? { message: "Created" } : { error: "Unable to create" }));
              return { ok, message: message?.error ?? message?.message ?? "Unknown" };
            }),
          );

          const successCount = results.filter((item) => item.ok).length;
          const failureCount = results.length - successCount;

          if (successCount > 0) {
            toast.success(`Created ${successCount} submaster${successCount > 1 ? "s" : ""}`);
          }
          if (failureCount > 0) {
            const firstError = results.find((item) => !item.ok)?.message ?? "Unable to create";
            toast.error(firstError);
            return;
          }
        }

        router.push("/admin/submasters");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Unable to save. Please try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{heading}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Attach nested options to a master, e.g., sub-brands under a company.
        </p>
        {!hasMasters ? (
          <p className="text-sm text-destructive">
            Add at least one master option before creating submasters.
          </p>
        ) : null}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between pb-3">
                  <p className="text-sm font-semibold text-foreground">
                    {mode === "edit" ? "Submaster" : `Submaster ${index + 1}`}
                  </p>
                  {allowMultiple && rows.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`submaster-parent-${row.id}`}>Parent master</Label>
                    <Select
                      value={row.masterId}
                      onValueChange={(value) => updateRow(row.id, "masterId", value)}
                      disabled={!hasMasters || isPending}
                    >
                      <SelectTrigger id={`submaster-parent-${row.id}`} className="w-full">
                        <SelectValue placeholder="Select master" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedMasters.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {masterTypeLabels[option.type]} — {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`submaster-name-${row.id}`}>Name</Label>
                    <Input
                      id={`submaster-name-${row.id}`}
                      value={row.name}
                      onChange={(event) => updateRow(row.id, "name", event.target.value)}
                      placeholder="e.g. Sub-brand name"
                      required={!allowMultiple}
                      aria-required={!allowMultiple}
                      disabled={!hasMasters}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <div className="space-y-2">
                    <Label htmlFor={`submaster-description-${row.id}`}>Description (optional)</Label>
                    <Textarea
                      id={`submaster-description-${row.id}`}
                      value={row.description}
                      onChange={(event) => updateRow(row.id, "description", event.target.value)}
                      placeholder="Notes for teammates about when to use this submaster."
                      disabled={!hasMasters}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`submaster-sort-${row.id}`}>Sort order (optional)</Label>
                    <Input
                      id={`submaster-sort-${row.id}`}
                      type="number"
                      min={0}
                      value={row.sortOrder}
                      onChange={(event) => updateRow(row.id, "sortOrder", event.target.value)}
                      placeholder="0"
                      disabled={!hasMasters}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower numbers appear first within the selected master.
                    </p>
                  </div>
                </div>
                {row.error ? (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {row.error}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {allowMultiple ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={addRow}
                disabled={isPending || !hasMasters}
              >
                + Add another submaster
              </Button>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/submasters")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !hasMasters}>
            {mode === "edit" ? "Save changes" : "Create submasters"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
