import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubMasterForm } from "@/components/submasters/submaster-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { masterTypes } from "@/lib/master-constants";
import { listMasterOptions } from "@/lib/master-options";
import { getSubMasterOptionById } from "@/lib/submaster-options";

export const metadata: Metadata = {
  title: "Edit submaster | Rajesh Control",
};

export default async function EditSubMasterPage({
  params,
}: {
  params: { id: string };
}) {
  const [submaster, masters] = await Promise.all([
    getSubMasterOptionById(params.id),
    listMasterOptions(masterTypes),
  ]);

  if (!submaster) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">
            Edit submaster
          </h1>
          <p className="text-sm text-muted-foreground">
            Update the sub-brand or child option linked to this master.
          </p>
        </div>
        <Button asChild variant="ghost" className="sm:ml-auto">
          <Link href="/admin/submasters">Back to submasters</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Submaster details
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Keep parent mappings accurate so product selectors stay in sync.
          </p>
        </CardHeader>
        <CardContent>
          <SubMasterForm
            mode="edit"
            masters={masters}
            initialData={submaster}
            initialMasterId={submaster.masterId}
          />
        </CardContent>
      </Card>
    </section>
  );
}
