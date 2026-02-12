import Link from "next/link";
import {
  CreditCard,
  Headset,
  PackageCheckIcon,
  RotateCcw,
  Laptop,
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
} from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/products";
import { HeroSwiper } from "@/components/home/hero-swiper";

type Product = Awaited<ReturnType<typeof listProducts>>[number];

function SectionTitle({
  title,
  subtitle,
  actionHref,
  actionText,
}: {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionText?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {subtitle}
          </p>
        )}
      </div>
      {actionHref && actionText ? (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
        >
          {actionText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

function TrustRow() {
  const benefits = [
    {
      icon: PackageCheckIcon,
      title: "Pan India Delivery",
      description: "Fast shipping across India with tracking",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Encrypted checkout with trusted methods",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "Simple 7-day returns on eligible items",
    },
    {
      icon: Headset,
      title: "Dedicated Support",
      description: "Quick responses from our team",
    },
  ];

  return (
    <section className="relative py-16">
      {/* Subtle divider line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-neutral-800" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit, idx) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 dark:border-neutral-800 dark:bg-neutral-900"
              style={{
                animationDelay: `${idx * 100}ms`,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 transition-colors group-hover:bg-neutral-900 dark:bg-neutral-800 dark:group-hover:bg-neutral-700">
                  <Icon className="h-5 w-5 text-neutral-700 transition-colors group-hover:text-white dark:text-neutral-300 dark:group-hover:text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                    {benefit.title}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {benefit.description}
                  </p>
                </div>
              </div>

              {/* Subtle hover effect */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/50 to-transparent dark:from-neutral-800/50" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PromoTiles() {
  const promos = [
    {
      href: {
        pathname: "/products",
        query: { category: "Laptops", companyName: "Apple" },
      },
      badge: "Premium picks",
      title: "MacBooks & Premium",
      description: "Clean builds, top condition",
      gradient: "from-neutral-800 via-neutral-700 to-neutral-800",
      accentColor: "text-neutral-300",
      badgeColor: "text-neutral-400",
      glowColor: "bg-neutral-400/10",
    },
    {
      href: {
        pathname: "/products",
        query: { category: "Laptops", companyName: "Dell" },
      },
      badge: "Workstation deals",
      title: "Premium Dell Laptops",
      description: "Business-ready, powerful, reliable",
      gradient: "from-neutral-800 via-neutral-750 to-neutral-800",
      accentColor: "text-neutral-200",
      badgeColor: "text-neutral-400",
      glowColor: "bg-neutral-300/10",
    },
    {
      href: {
        pathname: "/products",
        query: { category: "Gaming Laptops", search: "gaming" },
      },
      badge: "Performance",
      title: "Gaming Laptops",
      description: "High FPS builds, serious cooling",
      gradient: "from-neutral-900 via-neutral-800 to-neutral-900",
      accentColor: "text-neutral-200",
      badgeColor: "text-neutral-400",
      glowColor: "bg-neutral-400/10",
    },
    {
      href: "/products?category=Tablets",
      badge: "Flexible",
      title: "2-in-1 / Detachables",
      description: "Touch, pen, and portability",
      gradient: "from-neutral-900 via-neutral-800 to-neutral-900",
      accentColor: "text-neutral-300",
      badgeColor: "text-neutral-500",
      glowColor: "bg-neutral-400/10",
    },
  ];

  return (
    <section className="py-16">
      <SectionTitle
        title="Shop by Category"
        subtitle="Curated collections for every need"
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-4">
        {promos.map((promo) => (
          <Link
            key={promo.title}
            href={promo.href}
            className={`group relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-2xl border border-neutral-700/40 bg-gradient-to-br ${promo.gradient} p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-neutral-600/60 hover:shadow-xl`}
          >
            <div
              className={`text-xs font-semibold uppercase tracking-widest ${promo.badgeColor}`}
            >
              {promo.badge}
            </div>

            <div
              className={`mt-3 text-2xl font-bold tracking-tight ${promo.accentColor}`}
            >
              {promo.title}
            </div>

            <div className="mt-2 text-sm text-neutral-400">
              {promo.description}
            </div>

            <div className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-neutral-300 transition group-hover:text-white">
              Shop now <ArrowRight className="h-4 w-4" />
            </div>

            {/* Subtle glow effect */}
            <div
              className={`pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full ${promo.glowColor} blur-3xl`}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <div className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
          {title}
        </div>
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="overflow-x-auto p-6 pb-4">
        <div className="flex gap-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {items.slice(0, 8).map((p) => (
            <div key={p.id} className="w-[260px] shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
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
      <SectionTitle
        title="Frequently Asked Questions"
        subtitle="Everything you need to know"
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {faqs.map((f, idx) => (
          <div
            key={f.q}
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
            style={{
              animationDelay: `${idx * 100}ms`,
            }}
          >
            <div className="font-semibold text-neutral-900 dark:text-neutral-50">
              {f.q}
            </div>
            <div className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {f.a}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhyRefurbished() {
  const benefits = [
    "Better specs per rupee compared to new devices",
    "Tested devices with warranty support",
    "Great for office, student, and WFH use-cases",
    "Eco-friendly choice by extending device life",
  ];

  return (
    <section className="relative overflow-hidden py-20">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(0 0 0) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(0 0 0) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <Sparkles className="h-3.5 w-3.5" />
            Why refurbished makes sense
          </div>

          <h3 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
            Save more without compromising on performance
          </h3>

          <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            Refurbished laptops are thoroughly checked, cleaned, and tested. You
            get premium specs at a better price — ideal for students,
            professionals, and businesses building fleets.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              asChild
              className="bg-neutral-900 text-white transition-all hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Link href="/products">Shop laptops</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-neutral-300 transition-all hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
            >
              <Link href="/register">Get bulk pricing</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
            <div className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
              Key Benefits
            </div>
          </div>

          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      quote:
        "Great experience. The laptop condition was excellent and delivery was quick.",
      author: "Verified Customer",
    },
    {
      quote: "Solid performance and clean device. Support team responded fast.",
      author: "Verified Customer",
    },
  ];

  return (
    <section className="py-16">
      <SectionTitle
        title="Hear It From Customers"
        subtitle="Real experiences from our community"
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {testimonials.map((testimonial, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
              "{testimonial.quote}"
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {testimonial.author[0]}
                </span>
              </div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                {testimonial.author}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="py-20">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-12 text-center shadow-lg dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(0 0 0) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(0 0 0) 1px, transparent 1px)
              `,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Ready to upgrade?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
            Explore today's best refurbished deals and find the right laptop for
            your needs.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="bg-neutral-900 text-white transition-all hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Link href="/products">Shop now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-neutral-300 transition-all hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
            >
              <Link href="/login">My account</Link>
            </Button>
          </div>
        </div>
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
    {},
  );
  const topBrands = Object.entries(brandBuckets)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  const under20 = popular.filter(
    (p) => typeof p.price === "number" && p.price <= 20000,
  );
  const under30 = popular.filter(
    (p) => typeof p.price === "number" && p.price > 20000 && p.price <= 30000,
  );
  const under40 = popular.filter(
    (p) => typeof p.price === "number" && p.price > 30000 && p.price <= 40000,
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      <HeroSwiper />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <TrustRow />

        {/* CRAZY DEALS */}
        <section className="py-16">
          <SectionTitle
            title="Crazy Refurbished Deals"
            subtitle="Handpicked deals with the best value-to-spec ratio"
            actionHref="/products"
            actionText="See all products"
          />
          <div className="mt-8">
            <ProductGrid items={crazyDeals} />
          </div>
        </section>

        {/* PROMO TILES */}
        <PromoTiles />

        {/* BRAND SECTIONS */}
        {topBrands.length ? (
          <section className="py-8">
            {topBrands.map(([brand, items], idx) => (
              <div
                key={brand}
                className="border-t border-neutral-200 py-16 dark:border-neutral-800"
              >
                <SectionTitle
                  title={`${brand} Refurbished Laptops`}
                  subtitle={`Certified ${brand} devices at unbeatable prices`}
                  actionHref={`/products?company=${encodeURIComponent(brand)}`}
                  actionText="View all"
                />
                <div className="mt-8">
                  <ProductGrid items={items.slice(0, 8)} />
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {/* BUDGET SECTION */}
        <section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
          <SectionTitle
            title="Budget Refurbished Laptops"
            subtitle="Quality devices at every price point"
            actionHref="/products"
            actionText="Browse all"
          />
          <div className="mt-8 flex flex-col gap-5">
            {under20.length > 0 && (
              <BudgetRow
                title="Under ₹20,000"
                items={under20}
                href="/products?maxPrice=20000"
              />
            )}
            {under30.length > 0 && (
              <BudgetRow
                title="₹20,000 – ₹30,000"
                items={under30}
                href="/products?minPrice=20000&maxPrice=30000"
              />
            )}
            {under40.length > 0 && (
              <BudgetRow
                title="₹30,000 – ₹40,000"
                items={under40}
                href="/products?minPrice=30000&maxPrice=40000"
              />
            )}
          </div>
        </section>

        {/* WHY REFURBISHED */}
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <WhyRefurbished />
        </div>

        {/* TESTIMONIALS */}
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <Testimonials />
        </div>

        {/* FAQ */}
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <FAQ />
        </div>

        {/* Bottom CTA */}
        <BottomCTA />
      </div>
    </main>
  );
}
