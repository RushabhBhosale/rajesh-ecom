"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SessionUser } from "@/lib/auth";
import type { SavedAddress } from "@/lib/addresses";

interface ProfilePageProps {
  user: SessionUser;
}

type AddressFormState = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const emptyAddress: AddressFormState = {
  label: "",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export function ProfilePage({ user }: ProfilePageProps) {
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressForm, setAddressForm] = useState<AddressFormState>(emptyAddress);
  const [addressSaving, setAddressSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [profileRes, addressRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/addresses"),
        ]);
        const profileData = await profileRes.json().catch(() => null);
        const addressData = await addressRes.json().catch(() => null);
        if (!cancelled && profileRes.ok && profileData?.user) {
          setProfile({
            name: profileData.user.name,
            email: profileData.user.email,
            phone: profileData.user.phone ?? "",
          });
        }
        if (!cancelled && addressRes.ok && Array.isArray(addressData?.addresses)) {
          setAddresses(addressData.addresses);
        }
      } catch (error) {
        console.error("Failed to load profile data", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultAddressId = useMemo(() => addresses.find((a) => a.isDefault)?.id ?? null, [addresses]);

  const handleProfileChange =
    (key: "name" | "phone") => (event: React.ChangeEvent<HTMLInputElement>) => {
      setProfile((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileSaving(true);
    try {
      const response = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : Object.values(data?.error ?? {}).flat().find((msg) => typeof msg === "string") ??
              "Unable to update profile.";
        toast.error(message);
        return;
      }
      setProfile((prev) => ({
        ...prev,
        name: data.user?.name ?? prev.name,
        phone: data.user?.phone ?? prev.phone,
      }));
      toast.success("Profile updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddressChange =
    (key: keyof AddressFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
      setAddressForm((prev) => ({ ...prev, [key]: value as any }));
    };

  const submitAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    setAddressSaving(true);
    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : Object.values(data?.error ?? {}).flat().find((msg) => typeof msg === "string") ??
              "Unable to add address.";
        toast.error(message);
        return;
      }
      setAddresses((prev) => {
        const filtered = addressForm.isDefault ? prev.map((addr) => ({ ...addr, isDefault: false })) : prev;
        return [data.address, ...filtered];
      });
      setAddressForm(emptyAddress);
      toast.success("Address added");
    } catch (error) {
      console.error(error);
      toast.error("Unable to add address");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Unable to delete address");
        return;
      }
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      toast.success("Address removed");
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete address");
    }
  };

  const markDefault = async (address: SavedAddress) => {
    try {
      const response = await fetch(`/api/addresses/${address.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...address, isDefault: true }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error("Unable to update address");
        return;
      }
      setAddresses((prev) =>
        prev
          .map((addr) => ({ ...addr, isDefault: addr.id === address.id ? true : false }))
          .map((addr) => (addr.id === address.id ? data.address : addr))
      );
      toast.success("Default address updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update address");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">My profile</h1>
        <p className="text-sm text-muted-foreground">Manage your contact details and saved addresses for faster checkout.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={handleProfileChange("name")}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" value={profile.email} disabled readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  value={profile.phone}
                  onChange={handleProfileChange("phone")}
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
              <Button type="submit" disabled={profileSaving || loading}>
                {profileSaving ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={submitAddress} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address-label">Label (optional)</Label>
                <Input
                  id="address-label"
                  placeholder="Home, Office"
                  value={addressForm.label}
                  onChange={handleAddressChange("label")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-recipient" required>
                  Recipient name
                </Label>
                <Input
                  id="address-recipient"
                  value={addressForm.recipientName}
                  onChange={handleAddressChange("recipientName")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-phone" required>
                  Phone
                </Label>
                <Input
                  id="address-phone"
                  value={addressForm.phone}
                  onChange={handleAddressChange("phone")}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address-line1" required>
                  Address line 1
                </Label>
                <Input
                  id="address-line1"
                  value={addressForm.line1}
                  onChange={handleAddressChange("line1")}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address-line2">Address line 2 (optional)</Label>
                <Textarea
                  id="address-line2"
                  value={addressForm.line2}
                  onChange={handleAddressChange("line2")}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-city" required>
                  City
                </Label>
                <Input
                  id="address-city"
                  value={addressForm.city}
                  onChange={handleAddressChange("city")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-state" required>
                  State
                </Label>
                <Input
                  id="address-state"
                  value={addressForm.state}
                  onChange={handleAddressChange("state")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-postal" required>
                  Postal code
                </Label>
                <Input
                  id="address-postal"
                  value={addressForm.postalCode}
                  onChange={handleAddressChange("postalCode")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-country" required>
                  Country
                </Label>
                <Input
                  id="address-country"
                  value={addressForm.country}
                  onChange={handleAddressChange("country")}
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground md:col-span-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
                  checked={addressForm.isDefault}
                  onChange={handleAddressChange("isDefault")}
                />
                Set as default shipping address
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={addressSaving}>
                  {addressSaving ? "Saving..." : "Add address"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
              ) : (
                addresses.map((address) => (
                  <div
                    key={address.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-muted/20 p-3 text-sm text-muted-foreground"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {address.label || "Untitled address"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {address.recipientName} • {address.phone}
                        </p>
                      </div>
                      {address.isDefault ? (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="whitespace-pre-line">
                      {address.line1}
                      {address.line2 ? `\n${address.line2}` : ""}
                      {`\n${address.city}, ${address.state} ${address.postalCode}`}
                      {`\n${address.country}`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {!address.isDefault ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markDefault(address)}
                        >
                          Set as default
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(address.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
