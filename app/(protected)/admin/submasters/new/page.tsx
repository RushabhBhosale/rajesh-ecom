import Link from "next/link";
import { Metadata } from "next";

import { SubMasterForm } from "@/components/submasters/submaster-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { masterTypes } from "@/lib/master-constants";
import { listMasterOptions } from "@/lib/master-options";
import { listSubMasterOptions } from "@/lib/submaster-options";

export const metadata: Metadata = {
  title: "Add submaster | Rajesh Control",
};

export default async function NewSubMasterPage() {
  const [masters, submasters] = await Promise.all([
    listMasterOptions(masterTypes),
    listSubMasterOptions(),
  ]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">
            Add submaster
          </h1>
          <p className="text-sm text-muted-foreground">
            Link a sub-brand or nested option to an existing master.
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
            Choose a parent master, then add one or more child options beneath
            it.
          </p>
        </CardHeader>
        <CardContent>
          <SubMasterForm mode="create" masters={masters} submasters={submasters} />
        </CardContent>
      </Card>
    </section>
  );
}
