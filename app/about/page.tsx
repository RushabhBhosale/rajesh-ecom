// app/about/page.tsx (or wherever you render your About route)

"use client";

import Link from "next/link";
import {
  Shield,
  Recycle,
  Wrench,
  Leaf,
  Truck,
  Award,
  HeartHandshake,
} from "lucide-react";

export default function About() {
  const stats = [
    { label: "Devices Renewed", value: "12,500+" },
    { label: "Avg. CO₂ Saved/Device", value: "78%" },
    { label: "Customer Satisfaction", value: "4.9/5" },
    { label: "Countries Served", value: "7" },
  ];

  const features = [
    {
      icon: <Recycle className="h-5 w-5" aria-hidden />,
      title: "Sustainable by design",
      text: "Extending device lifecycles with careful refurbishment and responsible part sourcing.",
    },
    {
      icon: <Wrench className="h-5 w-5" aria-hidden />,
      title: "Enterprise-grade process",
      text: "80+ point QA checks, secure data erasure, and standardized diagnostics.",
    },
    {
      icon: <Shield className="h-5 w-5" aria-hidden />,
      title: "Warranty & support",
      text: "Every product ships with warranty options and responsive after-sales support.",
    },
    {
      icon: <Truck className="h-5 w-5" aria-hidden />,
      title: "Fast fulfillment",
      text: "Ready-to-ship inventory, safe packaging, and tracked dispatches.",
    },
  ];

  const values = [
    { icon: <Leaf className="h-5 w-5" />, title: "Respect the planet" },
    { icon: <Award className="h-5 w-5" />, title: "Insist on quality" },
    { icon: <HeartHandshake className="h-5 w-5" />, title: "Be helpful" },
  ];

  const timeline = [
    {
      year: "2021",
      title: "The first batch",
      text: "Started with a small lot of laptops—learned, iterated, improved.",
    },
    {
      year: "2022",
      title: "Scaling up",
      text: "Standardized QA, added warranty program, and grew our team.",
    },
    {
      year: "2024",
      title: "Beyond laptops",
      text: "Introduced tablets & accessories; expanded logistics partners.",
    },
    {
      year: "Today",
      title: "Circular by default",
      text: "Driving enterprise adoption of renewed devices at scale.",
    },
  ];

  const team = [
    { name: "Rajesh Kumar", role: "Founder & CEO", initials: "RK" },
    { name: "Priya Singh", role: "Head of Operations", initials: "PS" },
    { name: "Arun Nair", role: "QA & Warranty Lead", initials: "AN" },
  ];

  return (
    <main className="bg-background text-foreground">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
              About us
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Premium, planet-friendly refurbished electronics
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We extend the life of great hardware with enterprise-grade
              refurbishment, transparent warranties, and fast fulfillment—
              helping teams save budget and the environment.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/products"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Browse products
              </Link>
              <Link
                href="/contact"
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Contact sales
              </Link>
            </div>
          </div>

          {/* Stats */}
          <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border bg-card p-4 text-center"
              >
                <dt className="text-xs font-medium text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="mt-1 text-xl font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Mission + What we do */}
      <section className="border-t bg-card/50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Our mission</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Make high-quality technology accessible and sustainable by
              default. We believe renewed devices can meet (and often exceed)
              the reliability, performance, and value expectations of modern
              teams.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 text-primary">
                    {f.icon}
                    <h3 className="text-sm font-semibold">{f.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual placeholder */}
          <div className="relative">
            <div className="h-full min-h-[280px] w-full rounded-xl border bg-gradient-to-br from-accent via-secondary to-accent/60 p-1">
              <div className="flex h-full w-full items-center justify-center rounded-[calc(var(--radius-lg))] bg-card text-muted-foreground">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Leaf className="h-6 w-6" />
                  </div>
                  <p className="text-sm">
                    Circular hardware. Enterprise quality.{" "}
                    <span className="font-semibold">Less waste.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Values */}
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {values.map((v) => (
                <li
                  key={v.title}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                >
                  <span className="text-primary">{v.icon}</span>
                  <span className="text-sm font-medium">{v.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold">Our journey</h2>
          <ol className="mt-6 space-y-6">
            {timeline.map((t, idx) => (
              <li key={idx} className="relative ">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{t.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {t.year}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{t.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Team */}
      <section className="border-t bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold">Meet the team</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A small group of refurb pros, QA nerds, and logistics champions.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {team.map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-3 rounded-lg border bg-card p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {m.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="rounded-xl border bg-card p-6 md:p-8">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-semibold">
                  Ready to upgrade sustainably?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore in-stock, certified renewed devices—backed by
                  warranty.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/products"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Shop inventory
                </Link>
                <Link
                  href="/contact"
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
