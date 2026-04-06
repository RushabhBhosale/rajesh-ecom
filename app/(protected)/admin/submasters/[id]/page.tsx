import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { masterTypeLabels } from "@/lib/master-constants";
import { type SubMasterOptionSummary } from "@/lib/submaster-constants";
import { getSubMasterOptionById, listSubMasterOptions } from "@/lib/submaster-options";

export const metadata: Metadata = {
  title: "Submaster details | Rajesh Control",
};

interface AdminSubMasterDetailPageProps {
  params: Promise<{ id: string }>;
}

function buildPath(
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

export default async function AdminSubMasterDetailPage({
  params,
}: AdminSubMasterDetailPageProps) {
  const { id } = await params;
  const submaster = await getSubMasterOptionById(id);

  if (!submaster) {
    notFound();
  }

  const allForMaster = await listSubMasterOptions({ masterId: submaster.masterId });
  const lookup = new Map(allForMaster.map((item) => [item.id, item]));
  const parent = submaster.parentId ? lookup.get(submaster.parentId) ?? null : null;
  const children = allForMaster
    .filter((item) => item.parentId === submaster.id)
    .sort((a, b) => {
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
            Submaster details
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{submaster.name}</h1>
          <p className="text-sm text-muted-foreground">
            Type: {masterTypeLabels[submaster.masterType]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/submasters">Back to submasters</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/submasters/${submaster.id}/edit`}>Edit submaster</Link>
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
              <dt className="text-xs uppercase tracking-wide">Master</dt>
              <dd className="font-medium text-foreground">
                <Link
                  href={`/admin/masters/${submaster.masterId}`}
                  className="underline-offset-4 hover:underline"
                >
                  {submaster.masterName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Parent</dt>
              <dd className="font-medium text-foreground">
                {parent ? (
                  <Link
                    href={`/admin/submasters/${parent.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {parent.name}
                  </Link>
                ) : (
                  "Top level"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Sort order</dt>
              <dd className="font-medium text-foreground">
                {typeof submaster.sortOrder === "number" ? submaster.sortOrder : 0}
              </dd>
            </div>
          </dl>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Full path</p>
            <p className="text-sm text-foreground">{buildPath(submaster, lookup)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="text-sm text-muted-foreground">
              {submaster.description || "No description provided."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Child submasters</CardTitle>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No child submasters are linked to this option.
            </p>
          ) : (
            <ul className="space-y-3">
              {children.map((child) => (
                <li key={child.id} className="rounded-xl border border-border p-3">
                  <Link
                    href={`/admin/submasters/${child.id}`}
                    className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {child.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Sort: {typeof child.sortOrder === "number" ? child.sortOrder : 0}
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
