"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoreSettings } from "@/lib/store-settings";

interface SettingsFormProps {
  initialSettings: StoreSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleCheckbox =
    (key: "gstEnabled" | "shippingEnabled") => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSettings((prev) => ({ ...prev, [key]: event.target.checked }));
    };

  const handleNumber =
    (key: "gstRate" | "shippingAmount") => (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = Number.parseFloat(event.target.value);
      setSettings((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? parsed : 0 }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.error === "object" && data?.error !== null
              ? Object.values(data.error).flat().find((value) => typeof value === "string") ??
                "Unable to save settings. Check your inputs."
              : "Unable to save settings. Check your inputs.";
        toast.error(message);
        return;
      }

      setSettings(data.settings);
      toast.success("Settings updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GST</CardTitle>
          <CardDescription>Toggle GST and set the rate applied during checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
              checked={settings.gstEnabled}
              onChange={handleCheckbox("gstEnabled")}
            />
            Enable GST
          </label>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="gstRate">GST rate (%)</Label>
            <Input
              id="gstRate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={settings.gstRate}
              onChange={handleNumber("gstRate")}
              disabled={!settings.gstEnabled}
            />
            <p className="text-xs text-muted-foreground">Example: 18 for 18% GST.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping</CardTitle>
          <CardDescription>Optionally add a flat shipping fee to the order total.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
              checked={settings.shippingEnabled}
              onChange={handleCheckbox("shippingEnabled")}
            />
            Charge shipping
          </label>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="shippingAmount">Shipping amount (INR)</Label>
            <Input
              id="shippingAmount"
              type="number"
              min={0}
              step={100}
              value={settings.shippingAmount}
              onChange={handleNumber("shippingAmount")}
              disabled={!settings.shippingEnabled}
            />
            <p className="text-xs text-muted-foreground">Leave at 0 for complimentary shipping.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
