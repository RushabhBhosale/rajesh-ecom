"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Folder, FolderSearch } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { CategorySummary } from "@/lib/categories";

interface CategoriesTableProps {
  data: CategorySummary[];
}

export function CategoriesTable({ data }: CategoriesTableProps) {
  const columns = React.useMemo<ColumnDef<CategorySummary>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="font-medium text-foreground">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
        cell: ({ getValue }) => {
          const description = getValue<string>();
          if (!description) {
            return <span className="text-xs text-muted-foreground">No description</span>;
          }
          return <span className="text-sm text-muted-foreground">{description}</span>;
        },
      },
      {
        accessorKey: "productCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Products" align="right" />,
        cell: ({ getValue }) => <div className="text-right font-semibold">{getValue<number>()}</div>,
      },
      {
        accessorKey: "lastUpdated",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last updated" />, 
        cell: ({ getValue }) => {
          const value = getValue<string>();
          const formatted = value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";
          return <span className="text-sm text-muted-foreground">{formatted}</span>;
        },
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search categories by name"
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <FolderSearch className="h-10 w-10" aria-hidden />
          <p className="text-sm font-medium">No categories found</p>
          <p className="text-xs">Create categories from the add category page to populate this list.</p>
        </div>
      }
    />
  );
}
