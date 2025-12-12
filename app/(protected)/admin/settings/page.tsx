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
          Control GST and shipping charges applied during checkout.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </section>
  );
}
