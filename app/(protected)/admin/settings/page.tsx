import { Metadata } from "next";

import { SettingsForm } from "@/components/admin/settings-form";
import { getStoreSettings } from "@/lib/store-settings/server";

export const metadata: Metadata = {
  title: "Settings | Rajesh Control",
};

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Store settings</h1>
        <p className="text-sm text-muted-foreground">
          Control checkout pricing rules and storefront announcement banner content.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </section>
  );
}
