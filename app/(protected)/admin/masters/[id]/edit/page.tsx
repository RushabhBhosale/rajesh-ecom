import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MasterForm } from "@/components/masters/master-form";
import { Button } from "@/components/ui/button";
import { getMasterOptionById } from "@/lib/master-options";

export const metadata: Metadata = {
  title: "Edit master | Rajesh Control",
};

export default async function EditMasterPage({ params }: { params: { id: string } }) {
  const master = await getMasterOptionById(params.id);

  if (!master) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Edit master</h1>
          <p className="text-sm text-muted-foreground">
            Update the option name, description, or sort order.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/masters">Back to masters</Link>
        </Button>
      </div>
      <MasterForm mode="edit" initialData={master} initialType={master.type} />
    </section>
  );
}
