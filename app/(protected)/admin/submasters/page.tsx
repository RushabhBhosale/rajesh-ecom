import Link from "next/link";
import { Metadata } from "next";

import { SubMasterTable } from "@/components/submasters/submaster-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSubMasterOptions } from "@/lib/submaster-options";

export const metadata: Metadata = {
  title: "Submasters | Rajesh Control",
};

export default async function SubMastersPage() {
  const submasters = await listSubMasterOptions();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">
            Submasters
          </h1>
          <p className="text-sm text-muted-foreground">
            Create sub-brands and other nested options scoped to each master.
          </p>
        </div>
        <Button asChild size="lg" className="sm:ml-auto">
          <Link href="/admin/submasters/new">Add submaster</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">
            All submasters
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Submasters stay linked to their parent master, making it easy to
            manage sub-brands for companies and similar hierarchies.
          </p>
        </CardHeader>
        <CardContent>
          <SubMasterTable data={submasters} />
        </CardContent>
      </Card>
    </section>
  );
}
