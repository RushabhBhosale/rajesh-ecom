import Link from "next/link";
import { Metadata } from "next";

import { MasterTable } from "@/components/masters/master-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { masterTypeLabels, masterTypes } from "@/lib/master-constants";
import { listMasterOptions } from "@/lib/master-options";

export const metadata: Metadata = {
  title: "Masters | Rajesh Control",
};

export default async function MastersPage() {
  const options = await listMasterOptions(masterTypes);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Masters</h1>
          <p className="text-sm text-muted-foreground">
            View and manage shared attributes (company, processor, RAM, storage, graphics, OS).
          </p>
        </div>
        <Button asChild size="lg" className="sm:ml-auto">
          <Link href="/admin/masters/new">Add master</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Reference library</CardTitle>
          <p className="text-sm text-muted-foreground">
            These options appear in product forms and storefront filters.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <MasterTable data={options} />
        </CardContent>
      </Card>
    </section>
  );
}
