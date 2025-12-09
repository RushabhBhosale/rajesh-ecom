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
  masterTypes,
  type MasterOptionSummary,
  type MasterOptionType,
} from "@/lib/master-constants";

interface MasterFormProps {
  mode: "create" | "edit";
  initialType?: MasterOptionType;
  initialData?: MasterOptionSummary;
}

export function MasterForm({ mode, initialType = "company", initialData }: MasterFormProps) {
  const router = useRouter();
  const [rows, setRows] = useState(() => {
    if (initialData) {
      return [
        {
          id: initialData.id,
          type: initialData.type,
          name: initialData.name,
          description: initialData.description ?? "",
          sortOrder:
            typeof initialData.sortOrder === "number" ? String(initialData.sortOrder) : "",
          error: null as string | null,
        },
      ];
    }
    return [
      {
        id: "row-1",
        type: initialType,
        name: "",
        description: "",
        sortOrder: "",
        error: null as string | null,
      },
    ];
  });
  const [isPending, startTransition] = useTransition();

  const allowMultiple = mode === "create";

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${prev.length + 1}-${Date.now()}`,
        type: prev[prev.length - 1]?.type ?? initialType,
        name: "",
        description: "",
        sortOrder: "",
        error: null,
      },
    ]);
  }

  function updateRow(
    id: string,
    field: "type" | "name" | "description" | "sortOrder",
    value: string | MasterOptionType,
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
              error: field === "name" ? null : row.error,
            }
          : row,
      ),
    );
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  }

  const heading = useMemo(
    () => (mode === "edit" ? "Edit master option" : "Add master options"),
    [mode],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextRows = [...rows];
    let hasError = false;
    const payloads: Array<{
      type: MasterOptionType;
      name: string;
      description: string;
      sortOrder: number;
    }> = [];

    nextRows.forEach((row, index) => {
      const trimmed = row.name.trim();
      let error: string | null = null;
      if (!trimmed) {
        if (!allowMultiple) {
          error = "Name is required.";
        } else {
          // Skip completely empty rows in multi mode.
          return;
        }
      } else if (trimmed.length < 2) {
        error = "Name must be at least 2 characters.";
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
        type: row.type,
        name: trimmed,
        description: row.description.trim(),
        sortOrder: row.sortOrder ? Number.parseInt(row.sortOrder, 10) : 0,
      });
    });

    if (!payloads.length) {
      toast.error("Add at least one master option with a name.");
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
          const response = await fetch(`/api/masters/${initialData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => null);
            const message =
              typeof data?.error === "string" ? data.error : "Unable to update master option.";
            toast.error(message);
            return;
          }

          toast.success(`${masterTypeLabels[payload.type]} updated successfully`);
        } else {
          const results = await Promise.all(
            payloads.map(async (payload) => {
              const response = await fetch("/api/masters", {
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
            toast.success(`Created ${successCount} master option${successCount > 1 ? "s" : ""}`);
          }
          if (failureCount > 0) {
            const firstError = results.find((item) => !item.ok)?.message ?? "Unable to create";
            toast.error(firstError);
            return;
          }
        }

        router.push("/admin/masters");
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
          Create reusable values you can link to products for filtering and sorting.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {rows.map((row, index) => {
              const typeLabel = masterTypeLabels[row.type];
              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between pb-3">
                    <p className="text-sm font-semibold text-foreground">
                      {mode === "edit" ? "Master option" : `Option ${index + 1}`}
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
                      <Label htmlFor={`master-type-${row.id}`}>Type</Label>
                      <Select
                        value={row.type}
                        onValueChange={(value) => updateRow(row.id, "type", value as MasterOptionType)}
                        disabled={mode === "edit" && Boolean(initialData)}
                      >
                        <SelectTrigger id={`master-type-${row.id}`} className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {masterTypes.map((option) => (
                            <SelectItem key={option} value={option}>
                              {masterTypeLabels[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`master-name-${row.id}`}>Name</Label>
                      <Input
                        id={`master-name-${row.id}`}
                        value={row.name}
                        onChange={(event) => updateRow(row.id, "name", event.target.value)}
                        placeholder={`e.g. ${typeLabel}`}
                        required={!allowMultiple}
                        aria-required={!allowMultiple}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                    <div className="space-y-2">
                      <Label htmlFor={`master-description-${row.id}`}>Description (optional)</Label>
                      <Textarea
                        id={`master-description-${row.id}`}
                        value={row.description}
                        onChange={(event) => updateRow(row.id, "description", event.target.value)}
                        placeholder="Notes for teammates about when to use this option."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`master-sort-${row.id}`}>Sort order (optional)</Label>
                      <Input
                        id={`master-sort-${row.id}`}
                        type="number"
                        min={0}
                        value={row.sortOrder}
                        onChange={(event) => updateRow(row.id, "sortOrder", event.target.value)}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower numbers appear first in dropdowns. Leave blank for alphabetical order.
                      </p>
                    </div>
                  </div>
                  {row.error ? (
                    <p className="mt-2 text-sm text-destructive" role="alert">
                      {row.error}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {allowMultiple ? (
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={addRow} disabled={isPending}>
                + Add another option
              </Button>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/masters")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {mode === "edit" ? "Save changes" : "Create master options"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
