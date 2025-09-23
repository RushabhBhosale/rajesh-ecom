import Link from "next/link";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/products";

export default async function HomePage() {
  const featured = await listProducts({ featuredOnly: true, inStockOnly: true, limit: 6 });
  const fallbacks = featured.length ? featured : await listProducts({ inStockOnly: true, limit: 6 });

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-background to-background py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,theme(colors.primary/20),transparent_55%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-8 text-left">
            <span className="inline-flex items-center rounded-full bg-secondary px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground">
              Refurbished laptops & electronics
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Premium devices, renewed with precision and ready to perform
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Discover enterprise-grade laptops, tablets, and accessories that undergo a 50-point
              quality check, professional refurbishment, and ship with reliable warranty coverage.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link href="/products">Browse catalogue</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">Create business account</Link>
              </Button>
            </div>
            <dl className="grid gap-6 pt-6 text-muted-foreground sm:grid-cols-3">
              <div>
                <dt className="text-sm uppercase tracking-wide">Diagnostics</dt>
                <dd className="text-2xl font-semibold text-foreground">50+ point QA</dd>
              </div>
              <div>
                <dt className="text-sm uppercase tracking-wide">Warranty</dt>
                <dd className="text-2xl font-semibold text-foreground">6 month cover</dd>
              </div>
              <div>
                <dt className="text-sm uppercase tracking-wide">Turnaround</dt>
                <dd className="text-2xl font-semibold text-foreground">48h dispatch</dd>
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
                  <span className="mt-1 inline-flex size-2.5 rounded-full bg-primary" aria-hidden />
                  Certified components, thermal repaste, and battery health above 80% on every laptop.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex size-2.5 rounded-full bg-primary" aria-hidden />
                  Enterprise imaging, asset tagging, and desk delivery for onboarding at scale.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex size-2.5 rounded-full bg-primary" aria-hidden />
                  Flexible upgrade paths and buy-back options that keep your fleet future ready.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-secondary/40 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">Certified refurbishment</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Devices undergo full diagnostic testing, component-level repairs, and BIOS updates by
                manufacturer-trained engineers.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">Warranty & support</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Enjoy 6-month coverage with instant swap options, plus responsive support from our
                service desk in under 2 hours.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">Sustainable savings</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Extend device life cycles, reduce e-waste, and unlock up to 60% savings compared to
                brand-new procurement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-24" id="featured">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Ready-to-ship highlights
              </h2>
              <p className="max-w-2xl text-muted-foreground">
                Hand-picked devices with fresh batteries, SSD upgrades, and professional calibration
                to fit remote, hybrid, or on-site teams.
              </p>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link href="/products">View all products</Link>
            </Button>
          </div>
          {fallbacks.length ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {fallbacks.map((product) => (
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

      <section className="border-t border-border/60 bg-secondary/40 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-6 px-6 text-center">
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Need a custom rollout or bulk refresh?
          </h2>
          <p className="text-lg text-muted-foreground">
            Partner with our refurbishment experts for asset imaging, logistics, and lifecycle
            planning tailored to your workforce.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/register">Talk to sales</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Existing customer sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
