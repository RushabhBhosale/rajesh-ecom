"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setStatus("loading");
    setError(null);

    // Simple required validation on client
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!name || !email || !message) {
      setError("Please fill in your name, email, and message.");
      setStatus("idle");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to send");
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="bg-background text-foreground">
      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
              Contact us
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              We’re here to help
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Questions about inventory, warranties, or bulk orders? Send us a
              message and our team will get back within one business day.
            </p>
          </div>

          {/* Quick contacts */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Email</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Prefer email? We typically reply same day.
              </p>
              <Link
                href="mailto:support@example.com"
                className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              >
                support@example.com
              </Link>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-primary">
                <Phone className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Phone</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Mon–Fri, 9:30–18:00 IST
              </p>
              <a
                href="tel:+910000000000"
                className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              >
                +91 00000 00000
              </a>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Office</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Visit by appointment.
              </p>
              <p className="mt-3 text-sm">BKC, Mumbai, IN</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Response time</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Most messages answered within 24h.
              </p>
              <p className="mt-3 text-sm">Priority for enterprise orders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="border-b bg-card/50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-14 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border bg-card p-6 md:p-8">
            <h2 className="text-xl font-semibold">Send a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us a little about what you need and we’ll follow up.
            </p>

            <form
              className="mt-6 space-y-4"
              action={onSubmit as unknown as string}
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit(new FormData(e.currentTarget as HTMLFormElement));
              }}
            >
              {/* Honeypot */}
              <input
                type="text"
                name="company"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">
                    Name <span className="text-red-500" aria-hidden>*</span>
                  </span>
                  <Input name="name" placeholder="Your name" required />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">
                    Email <span className="text-red-500" aria-hidden>*</span>
                  </span>
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Subject</span>
                <Input name="subject" placeholder="How can we help?" />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">
                  Message <span className="text-red-500" aria-hidden>*</span>
                </span>
                <Textarea
                  name="message"
                  placeholder="Share details about your request…"
                  rows={6}
                  required
                />
              </label>

              <div
                aria-live="polite"
                className="text-sm text-destructive min-h-[1.25rem]"
              >
                {error}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="inline-flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {status === "loading" ? "Sending…" : "Send message"}
                </Button>
                {status === "success" && (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    Message sent! We’ll get back soon.
                  </span>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {/* Map placeholder (swap with your embed when ready) */}
            <div className="rounded-xl border bg-card p-2">
              <div className="aspect-video w-full overflow-hidden rounded-lg border">
                <iframe
                  title="Office Location"
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  // Replace with your exact map/embed
                  src="https://www.openstreetmap.org/export/embed.html?bbox=73.015%2C19.053%2C73.021%2C19.059&layer=mapnik&marker=19.05587%2C73.01825"
                />
              </div>
            </div>

            {/* FAQ */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-base font-semibold">FAQs</h3>
              <div className="mt-4 space-y-4 text-sm">
                <details className="rounded border p-3">
                  <summary className="cursor-pointer font-medium">
                    Do you offer bulk/enterprise pricing?
                  </summary>
                  <p className="mt-2 text-muted-foreground">
                    Yes—send quantities/specs and we’ll quote the best bundle
                    price with warranty options.
                  </p>
                </details>
                <details className="rounded border p-3">
                  <summary className="cursor-pointer font-medium">
                    What’s your warranty policy?
                  </summary>
                  <p className="mt-2 text-muted-foreground">
                    Every renewed device ships with a standard warranty;
                    extended coverage is available at checkout.
                  </p>
                </details>
                <details className="rounded border p-3">
                  <summary className="cursor-pointer font-medium">
                    How fast do you ship?
                  </summary>
                  <p className="mt-2 text-muted-foreground">
                    In-stock items typically dispatch within 24–48 hours with
                    tracking provided.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="rounded-xl border bg-card p-6 md:p-8">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-semibold">Prefer email?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We’ll reply within one business day.
                </p>
              </div>
              <Link
                href="mailto:sales@example.com"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                sales@example.com
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
