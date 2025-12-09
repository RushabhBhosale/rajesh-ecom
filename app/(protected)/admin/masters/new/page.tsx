import Link from "next/link";
import { Metadata } from "next";

import { MasterForm } from "@/components/masters/master-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Add master | Rajesh Control",
};

export default function NewMasterPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Add master</h1>
          <p className="text-sm text-muted-foreground">
            Create a reusable option to attach to products for filtering and sorting.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/masters">Back to masters</Link>
        </Button>
      </div>
      <MasterForm mode="create" />
    </section>
  );
}
