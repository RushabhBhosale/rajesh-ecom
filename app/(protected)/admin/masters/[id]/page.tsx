import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { masterTypeLabels } from "@/lib/master-constants";
import { getMasterOptionById } from "@/lib/master-options";
import { type SubMasterOptionSummary } from "@/lib/submaster-constants";
import { listSubMasterOptions } from "@/lib/submaster-options";

export const metadata: Metadata = {
  title: "Master details | Rajesh Control",
};

interface AdminMasterDetailPageProps {
  params: Promise<{ id: string }>;
}

function buildSubMasterPath(
  option: SubMasterOptionSummary,
  lookup: Map<string, SubMasterOptionSummary>
) {
  const parts = [option.name];
  const seen = new Set<string>([option.id]);
  let current = option;

  while (current.parentId) {
    if (seen.has(current.parentId)) {
      break;
    }
    seen.add(current.parentId);
    const parent = lookup.get(current.parentId);
    if (!parent) {
      break;
    }
    parts.unshift(parent.name);
    current = parent;
  }

  return [option.masterName, ...parts].join(" / ");
}

export default async function AdminMasterDetailPage({
  params,
}: AdminMasterDetailPageProps) {
  const { id } = await params;
  const [master, submasters] = await Promise.all([
    getMasterOptionById(id),
    listSubMasterOptions({ masterId: id }),
  ]);

  if (!master) {
    notFound();
  }

  const submasterLookup = new Map(submasters.map((item) => [item.id, item]));
  const sortedSubmasters = [...submasters].sort((a, b) => {
    const orderA = typeof a.sortOrder === "number" ? a.sortOrder : 0;
    const orderB = typeof b.sortOrder === "number" ? b.sortOrder : 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Master details
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{master.name}</h1>
          <p className="text-sm text-muted-foreground">
            Type: {masterTypeLabels[master.type]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/masters">Back to masters</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/masters/${master.id}/edit`}>Edit master</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide">Type</dt>
              <dd className="font-medium text-foreground">
                {masterTypeLabels[master.type]}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Sort order</dt>
              <dd className="font-medium text-foreground">
                {typeof master.sortOrder === "number" ? master.sortOrder : 0}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Submasters</dt>
              <dd className="font-medium text-foreground">{submasters.length}</dd>
            </div>
          </dl>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="text-sm text-muted-foreground">
              {master.description || "No description provided."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked submasters</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSubmasters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No submasters are linked to this master yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {sortedSubmasters.map((item) => (
                <li key={item.id} className="rounded-xl border border-border p-3">
                  <Link
                    href={`/admin/submasters/${item.id}`}
                    className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {buildSubMasterPath(item, submasterLookup)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Sort: {typeof item.sortOrder === "number" ? item.sortOrder : 0}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
