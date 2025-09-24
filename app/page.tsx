import Link from "next/link";
import {
  Headphones,
  Laptop,
  MonitorSmartphone,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/products";

export default async function HomePage() {
  const featured = await listProducts({ featuredOnly: true, inStockOnly: true, limit: 8 });
  const popular = await listProducts({ inStockOnly: true, limit: 12 });
  const curated = featured.length ? featured : popular;
  const trending = curated.slice(0, 4);
  const seenIds = new Set(trending.map((item) => item.id));
  const moreToExplore = popular.filter((product) => !seenIds.has(product.id)).slice(0, 6);

  const categories = [
    {
      name: "Laptops",
      description: "Certified ThinkPad, Latitude & EliteBook models ready for deployment.",
      href: "/products?category=Laptops",
      icon: Laptop,
    },
    {
      name: "Tablets & 2-in-1",
      description: "Surface, iPad, and convertible devices with fresh batteries.",
      href: "/products?category=Tablets",
      icon: MonitorSmartphone,
    },
    {
      name: "Accessories",
      description: "Docking stations, monitors, keyboards, and essential peripherals.",
      href: "/products?category=Accessories",
      icon: PackageCheck,
    },
    {
      name: "Audio & collaboration",
      description: "Noise-cancelling headsets and conferencing gear for hybrid teams.",
      href: "/products?category=Audio",
      icon: Headphones,
    },
  ];

  const services = [
    {
      title: "Express shipping",
      description: "Nationwide 2-day delivery with real-time tracking on every order.",
      icon: Truck,
    },
    {
      title: "Trusted warranty",
      description: "6-month hardware coverage and rapid-swap support from certified technicians.",
      icon: ShieldCheck,
    },
    {
      title: "Easy refresh",
      description: "Trade-in and buy-back programs that keep your device fleet modern and sustainable.",
      icon: RefreshCcw,
    },
  ];

  const testimonials = [
    {
      quote:
        "Rajesh Renewed equips 300+ of our consultants every year. Devices arrive imaged, tagged, and ready for day one.",
      author: "Priya N.",
      role: "IT Director, Horizon Analytics",
    },
    {
      quote:
        "The 48-hour dispatch and swap program keeps our remote workforce productive without ballooning budgets.",
      author: "Michael R.",
      role: "Operations Lead, Northwind Logistics",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/50 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,theme(colors.primary/25),transparent_60%)]" />
        <div className="absolute -right-24 top-10 -z-10 size-[26rem] rounded-full bg-secondary/50 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-8 text-center lg:text-left">
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Rajesh renewed marketplace
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Enterprise tech that feels brand new—without the new price tag
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground lg:mx-0">
              Outfit your teams with expertly refurbished laptops, tablets, and accessories. Every device ships ready to deploy with imaging, QA checks, and dependable warranty coverage.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/products">Shop best sellers</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link href="/register">Set up business pricing</Link>
              </Button>
            </div>
            <dl className="grid gap-6 pt-6 text-muted-foreground sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <Sparkles className="mb-3 h-5 w-5 text-primary" aria-hidden />
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">Certified QA</dt>
                <dd className="text-lg font-semibold text-foreground">50-point inspection</dd>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <ShieldCheck className="mb-3 h-5 w-5 text-primary" aria-hidden />
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">Warranty</dt>
                <dd className="text-lg font-semibold text-foreground">6-month coverage</dd>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
                <Truck className="mb-3 h-5 w-5 text-primary" aria-hidden />
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">Dispatch</dt>
                <dd className="text-lg font-semibold text-foreground">48-hour shipping</dd>
              </div>
            </dl>
          </div>
          <div className="relative rounded-3xl border border-primary/20 bg-card/80 p-8 shadow-xl shadow-primary/10">
            <div className="absolute -left-10 top-10 hidden size-32 rounded-full bg-primary/10 blur-3xl lg:block" />
            <div className="absolute -right-10 bottom-10 hidden size-32 rounded-full bg-secondary/50 blur-3xl lg:block" />
            <div className="relative space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">Why teams choose Rajesh Renewed</h2>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 text-primary" aria-hidden />
                  Premium grade components, thermal repaste, and minimum 80% battery health on every unit.
                </li>
                <li className="flex items-start gap-3">
                  <PackageCheck className="mt-1 h-4 w-4 text-primary" aria-hidden />
                  Imaging, asset tagging, and kitting tailored to onboarding flows for hybrid and remote teams.
                </li>
                <li className="flex items-start gap-3">
                  <RefreshCcw className="mt-1 h-4 w-4 text-primary" aria-hidden />
                  Flexible refresh cycles with buy-back credits that keep budgets predictable.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-background/95 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4 text-muted-foreground sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">Trusted by teams at</p>
          <ul className="flex flex-wrap items-center gap-6 text-sm font-medium">
            {["TechNova", "GreenGrid", "Orbit Labs", "InsightWorks", "RapidScale", "BlueOrbit"].map((brand) => (
              <li key={brand} className="rounded-full border border-border/60 px-4 py-1 text-foreground/80">
                {brand}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20" id="deals">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Today's featured deals</h2>
              <p className="text-muted-foreground">
                Limited-time savings on our most requested work-from-anywhere devices.
              </p>
            </div>
            <Button asChild variant="secondary" size="lg" className="mx-auto sm:mx-0 rounded-full">
              <Link href="/products">View all offers</Link>
            </Button>
          </div>
          {trending.length ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {trending.map((product) => (
                <div key={product.id} id={product.id} className="scroll-mt-24">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-6 py-16 text-center text-muted-foreground">
              New inventory will appear here once added from the admin panel.
            </div>
          )}
        </div>
      </section>

      <section className="bg-secondary/40 py-16 sm:py-20" id="categories">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Shop by category</h2>
            <p className="text-muted-foreground">
              Discover curated collections tailored to finance, engineering, design, and support teams.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {categories.map(({ name, description, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                className="group rounded-3xl border border-border/70 bg-background p-6 transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                  </div>
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                </div>
                <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Shop now
                  <span aria-hidden>→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20" id="featured">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">More to explore</h2>
              <p className="text-muted-foreground">Handpicked gear to round out your workspace refresh.</p>
            </div>
            <Button asChild variant="outline" size="lg" className="mx-auto sm:mx-0 rounded-full">
              <Link href="/products">Browse full catalogue</Link>
            </Button>
          </div>
          {moreToExplore.length ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {moreToExplore.map((product) => (
                <div key={product.id} className="scroll-mt-24">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-6 py-16 text-center text-muted-foreground">
              Add more products from the admin console to populate this section.
            </div>
          )}
        </div>
      </section>

      <section className="bg-secondary/30 py-16 sm:py-20" id="services">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Services that scale with you</h2>
            <p className="text-muted-foreground">
              From onboarding to lifecycle planning, Rajesh Renewed keeps your teams supported.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {services.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-3xl border border-border/60 bg-background p-6 text-center shadow-sm"
              >
                <span className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Loved by modern IT teams</h2>
            <p className="text-muted-foreground">
              Transparent device grades, predictable pricing, and people-first support have made us the trusted partner for thousands of refreshed workstations.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {testimonials.map((testimonial) => (
                <figure
                  key={testimonial.author}
                  className="rounded-3xl border border-border/60 bg-secondary/40 p-6 text-left shadow-sm"
                >
                  <blockquote className="text-sm text-foreground">“{testimonial.quote}”</blockquote>
                  <figcaption className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {testimonial.author} · {testimonial.role}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-secondary/40 p-8 text-center shadow-sm">
            <h3 className="text-2xl font-semibold text-foreground">Need a custom rollout or bulk refresh?</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Partner with our refurbishment experts for asset imaging, logistics, and lifecycle planning tailored to your workforce.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/register">Talk to sales</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link href="/login">Existing customer sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
