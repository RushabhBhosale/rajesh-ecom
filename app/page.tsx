import Link from "next/link";
import {
  CreditCard,
  Headset,
  PackageCheckIcon,
  RotateCcw,
  Laptop,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/products";
import { HeroSwiper } from "@/components/home/hero-swiper";

type Product = Awaited<ReturnType<typeof listProducts>>[number];

function SectionTitle({
  title,
  actionHref,
  actionText,
}: {
  title: string;
  actionHref?: string;
  actionText?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-primary text-2xl font-bold sm:text-3xl">{title}</h2>
      {actionHref && actionText ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          {actionText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function TrustRow() {
  return (
    <section className="py-10">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
            <PackageCheckIcon className="h-6 w-6 text-primary2" />
          </div>
          <div className="min-w-0">
            <div className="text-primary text-base font-semibold">
              Pan India Delivery
            </div>
            <p className="mt-1 text-primary2 text-sm leading-6">
              Fast shipping across India with tracking.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
            <CreditCard className="h-6 w-6 text-primary2" />
          </div>
          <div className="min-w-0">
            <div className="text-primary text-base font-semibold">
              Secure Payments
            </div>
            <p className="mt-1 text-primary2 text-sm leading-6">
              Encrypted checkout with trusted methods.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
            <RotateCcw className="h-6 w-6 text-primary2" />
          </div>
          <div className="min-w-0">
            <div className="text-primary text-base font-semibold">
              Easy Returns
            </div>
            <p className="mt-1 text-primary2 text-sm leading-6">
              Simple 7-day returns on eligible items.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
            <Headset className="h-6 w-6 text-primary2" />
          </div>
          <div className="min-w-0">
            <div className="text-primary text-base font-semibold">
              Dedicated Support
            </div>
            <p className="mt-1 text-primary2 text-sm leading-6">
              Quick responses from our team.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PromoTiles() {
  return (
    <section className="py-12">
      <div className="grid gap-6 lg:grid-cols-4">
        <Link
          href="/products?category=Laptops"
          className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-7 shadow-sm"
        >
          <div className="text-white/80 text-xs font-semibold uppercase tracking-widest">
            Premium picks
          </div>
          <div className="mt-2 text-white text-2xl font-bold">
            MacBooks & Premium
          </div>
          <div className="mt-2 text-white/80 text-sm">
            Clean builds, top condition.
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
            Shop now <ArrowRight className="h-4 w-4" />
          </div>
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        </Link>

        <Link
          href="/products?company=Dell"
          className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-primary to-primary2 p-7 shadow-sm"
        >
          <div className="text-white/80 text-xs font-semibold uppercase tracking-widest">
            Workstation deals
          </div>
          <div className="mt-2 text-white text-2xl font-bold">
            Premium Dell Laptops
          </div>
          <div className="mt-2 text-white/80 text-sm">
            Business-ready, powerful, reliable.
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
            Shop now <ArrowRight className="h-4 w-4" />
          </div>
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        </Link>

        <Link
          href="/products?category=Laptops&tag=gaming"
          className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-700 p-7 shadow-sm"
        >
          <div className="text-white/80 text-xs font-semibold uppercase tracking-widest">
            Performance
          </div>
          <div className="mt-2 text-white text-2xl font-bold">
            OG Gaming Laptops
          </div>
          <div className="mt-2 text-white/80 text-sm">
            High FPS builds, serious cooling.
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
            Shop now <ArrowRight className="h-4 w-4" />
          </div>
          <div className="pointer-events-none absolute -right-16 top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        </Link>

        <Link
          href="/products?category=Tablets"
          className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-7 shadow-sm"
        >
          <div className="text-primary2 text-xs font-semibold uppercase tracking-widest">
            Flexible
          </div>
          <div className="mt-2 text-primary text-2xl font-bold">
            2-in-1 / Detachables
          </div>
          <div className="mt-2 text-primary2 text-sm">
            Touch, pen, and portability.
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Shop now <ArrowRight className="h-4 w-4" />
          </div>
          <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-slate-200/60 blur-2xl" />
        </Link>
      </div>
    </section>
  );
}

function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function BudgetRow({
  title,
  items,
  href,
}: {
  title: string;
  items: Product[];
  href: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="text-primary text-lg font-bold">{title}</div>
        <Link
          href={href}
          className="text-sm font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="mt-5 flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {items.slice(0, 8).map((p) => (
          <div key={p.id} className="w-[260px] shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Are refurbished laptops reliable?",
      a: "Yes. Each device is inspected, tested, cleaned, and sold with clear grading and warranty coverage.",
    },
    {
      q: "What warranty do you provide?",
      a: "We provide warranty coverage on eligible products. Exact duration depends on the product listing.",
    },
    {
      q: "Can I return a product?",
      a: "Yes, eligible products can be returned within 7 days as per return policy conditions.",
    },
    {
      q: "Do you ship across India?",
      a: "Yes, we offer pan-India delivery with tracking.",
    },
  ];

  return (
    <section className="py-16">
      <SectionTitle title="Frequently Asked Questions" />
      <div className="mt-6 grid gap-4">
        {faqs.map((f) => (
          <div
            key={f.q}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="text-primary font-semibold">{f.q}</div>
            <div className="mt-2 text-primary2 text-sm leading-6">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const popular = await listProducts({ inStockOnly: true, limit: 24 });
  const featured = await listProducts({
    featuredOnly: true,
    inStockOnly: true,
    limit: 12,
  });

  const crazyDeals = featured.length
    ? featured.slice(0, 12)
    : popular.slice(0, 12);

  const brandBuckets = popular.reduce<Record<string, Product[]>>(
    (acc, item) => {
      const b = item.company?.name?.trim();
      if (!b) return acc;
      (acc[b] ??= []).push(item);
      return acc;
    },
    {}
  );
  const topBrands = Object.entries(brandBuckets)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  const under20 = popular.filter(
    (p) => typeof p.price === "number" && p.price <= 20000
  );
  const under30 = popular.filter(
    (p) => typeof p.price === "number" && p.price > 20000 && p.price <= 30000
  );
  const under40 = popular.filter(
    (p) => typeof p.price === "number" && p.price > 30000 && p.price <= 40000
  );

  return (
    <main className="min-h-screen bg-background">
      <HeroSwiper />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <TrustRow />

        {/* CRAZY DEALS */}
        <section className="py-8">
          <SectionTitle
            title="Crazy Refurbished Deals"
            actionHref="/products"
            actionText="See all products"
          />
          <p className="mt-2 text-primary2 text-sm">
            Handpicked deals with the best value-to-spec ratio.
          </p>
          <div className="mt-6">
            <ProductGrid items={crazyDeals} />
          </div>
        </section>

        {/* PROMO TILES */}
        <PromoTiles />

        {/* BRAND SECTIONS */}
        {topBrands.length ? (
          <section className="py-10">
            {topBrands.map(([brand, items]) => (
              <div key={brand} className="py-8 border-t border-slate-200">
                <SectionTitle
                  title={`${brand} Refurbished Laptops`}
                  actionHref={`/products?company=${encodeURIComponent(brand)}`}
                  actionText="View all"
                />
                <div className="mt-6">
                  <ProductGrid items={items.slice(0, 8)} />
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {/* BUDGET SECTION */}
        <section className="py-12 border-t border-slate-200">
          <SectionTitle
            title="Budget Refurbished Laptops"
            actionHref="/products"
            actionText="Browse all"
          />
          <div className="mt-6 flex flex-col gap-5">
            <BudgetRow
              title="Under ₹20,000"
              items={under20}
              href="/products?maxPrice=20000"
            />
            <BudgetRow
              title="₹20,000 – ₹30,000"
              items={under30}
              href="/products?minPrice=20000&maxPrice=30000"
            />
            <BudgetRow
              title="₹30,000 – ₹40,000"
              items={under40}
              href="/products?minPrice=30000&maxPrice=40000"
            />
          </div>
        </section>

        {/* WHY REFURBISHED / CONTENT BLOCK */}
        <section className="py-14 border-t border-slate-200">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-primary2">
                <Sparkles className="h-4 w-4" />
                Why refurbished makes sense
              </div>

              <h3 className="text-primary text-2xl font-bold sm:text-3xl">
                Save more without compromising on performance.
              </h3>
              <p className="text-primary2 text-sm leading-7">
                Refurbished laptops are thoroughly checked, cleaned, and tested.
                You get premium specs at a better price — ideal for students,
                professionals, and businesses building fleets.
              </p>

              <div className="flex gap-3 pt-2">
                <Button
                  asChild
                  className="bg-primary text-white hover:opacity-90"
                >
                  <Link href="/products">Shop laptops</Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-300">
                  <Link href="/register">Get bulk pricing</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-primary text-lg font-bold">Key Benefits</div>
              <ul className="mt-4 space-y-3 text-primary2 text-sm">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary2" />
                  Better specs per rupee compared to new devices.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary2" />
                  Tested devices with warranty support.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary2" />
                  Great for office, student, and WFH use-cases.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary2" />
                  Eco-friendly choice by extending device life.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 border-t border-slate-200">
          <SectionTitle title="Hear It From Customers" />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-primary2 text-sm leading-7">
                “Great experience. The laptop condition was excellent and
                delivery was quick.”
              </div>
              <div className="mt-4 text-primary font-semibold">
                Verified Customer
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-primary2 text-sm leading-7">
                “Solid performance and clean device. Support team responded
                fast.”
              </div>
              <div className="mt-4 text-primary font-semibold">
                Verified Customer
              </div>
            </div>
          </div>
        </section>

        <FAQ />

        {/* Bottom CTA */}
        <section className="pb-20">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
            <div className="text-primary text-2xl font-bold">
              Ready to upgrade?
            </div>
            <p className="mt-2 text-primary2 text-sm">
              Explore today’s best refurbished deals and find the right laptop.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="bg-primary text-white hover:opacity-90"
              >
                <Link href="/products">Shop now</Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-300">
                <Link href="/login">My account</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
