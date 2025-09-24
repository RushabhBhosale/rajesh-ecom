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
  CheckCircle,
  Award,
  Wrench,
  Recycle,
  Headset,
  Users,
} from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/products";

export default async function HomePage() {
  const featured = await listProducts({
    featuredOnly: true,
    inStockOnly: true,
    limit: 8,
  });
  const popular = await listProducts({ inStockOnly: true, limit: 12 });
  const curated = featured.length ? featured : popular;
  const trending = curated.slice(0, 4);
  const seenIds = new Set(trending.map((item) => item.id));
  const moreToExplore = popular
    .filter((product) => !seenIds.has(product.id))
    .slice(0, 6);

  const categories = [
    {
      name: "Enterprise Laptops",
      description:
        "Certified ThinkPad, Latitude & EliteBook workstations with enterprise-grade specifications.",
      href: "/products?category=Laptops",
      icon: Laptop,
    },
    {
      name: "Mobile Computing",
      description:
        "Surface Pro, iPad, and convertible devices optimized for productivity and collaboration.",
      href: "/products?category=Tablets",
      icon: MonitorSmartphone,
    },
    {
      name: "Professional Accessories",
      description:
        "Docking stations, enterprise monitors, and certified peripherals for seamless workflows.",
      href: "/products?category=Accessories",
      icon: PackageCheck,
    },
    {
      name: "Collaboration Technology",
      description:
        "Professional headsets, conferencing solutions, and audio equipment for hybrid workforces.",
      href: "/products?category=Audio",
      icon: Headphones,
    },
  ];

  const services = [
    {
      title: "Enterprise Logistics",
      description:
        "Nationwide deployment with asset tracking, white-glove delivery, and real-time visibility across your entire fleet.",
      icon: Truck,
    },
    {
      title: "Comprehensive Warranty",
      description:
        "Industry-leading 6-month hardware coverage with advance replacement and certified technician support.",
      icon: ShieldCheck,
    },
    {
      title: "Lifecycle Management",
      description:
        "Strategic refresh planning with trade-in programs and asset disposition services for sustainable IT operations.",
      icon: RefreshCcw,
    },
  ];

  const testimonials = [
    {
      quote:
        "Rajesh Renewed has equipped over 300 consultants annually with consistently reliable, deployment-ready devices. Their quality assurance and logistics capabilities are exceptional.",
      author: "Priya N.",
      role: "IT Director, Horizon Analytics",
    },
    {
      quote:
        "The rapid replacement program and 48-hour fulfillment ensures our distributed workforce maintains productivity while optimizing our hardware budget by 40%.",
      author: "Michael R.",
      role: "Operations Lead, Northwind Logistics",
    },
  ];

  const stats = [
    { label: "Enterprise Clients", value: "500+", icon: Users },
    { label: "Devices Deployed", value: "25K+", icon: Laptop },
    { label: "Quality Rating", value: "99.2%", icon: Award },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section
        id="enterprise-hero"
        aria-labelledby="enterprise-hero-heading"
        className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-background to-slate-100/60 py-16 sm:py-20 lg:py-28"
      >
        {/* background tint + soft blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-slate-950/[0.04] dark:bg-slate-950/25" />
          <div className="absolute inset-0 bg-[radial-gradient(50rem_30rem_at_-10%_-10%,theme(colors.slate.200/35),transparent_60%)]" />
          <div className="absolute -right-32 top-16 size-[28rem] rounded-full bg-slate-200/40 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          {/* Left: headline + copy + CTAs + stats */}
          <div className="space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-900/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
              <Award className="mr-2 h-3.5 w-3.5" />
              Enterprise Ready
            </div>

            <h1
              id="enterprise-hero-heading"
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            >
              Refurbished hardware, deployment-ready.
            </h1>

            <p className="text-lg leading-7 text-slate-600">
              Certified devices with warranty, imaging, and asset tagging
              included. Scale faster with predictable refresh cycles and
              priority support— without paying new-device premiums.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button
                asChild
                size="lg"
                className="rounded-full px-7 font-semibold bg-slate-900 hover:bg-slate-800"
              >
                <Link href="/products">Shop inventory</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-7 font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Link href="/register">Get pricing</Link>
              </Button>
            </div>

            {/* compact stats */}
            <dl className="grid grid-cols-3 gap-6 pt-4">
              {[
                { value: "10k+", label: "Devices shipped" },
                { value: "50+", label: "QA checklist" },
                { value: "1 Year", label: "Warranty" },
              ].map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <dd className="text-2xl font-bold text-slate-900">
                    {s.value}
                  </dd>
                  <dt className="text-xs text-slate-600">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: fewer cards, more substance */}
          <div className="grid gap-4">
            <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:shadow-md">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Certified quality & longevity
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Each unit passes a 50-point inspection, component validation,
                and battery health checks (≥85% capacity). Devices ship clean,
                tested, and ready to enroll into your MDM.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:shadow-md">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Deployment services that scale
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Custom imaging, asset tags, and on-arrival configuration reduce
                desk time. Pair with volume pricing and priority SLA for smooth
                rollouts across teams and sites.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 text-slate-600 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Trusted by Leading Organizations
          </p>
          <ul className="flex flex-wrap items-center gap-6 text-sm font-medium">
            {[
              "TechNova Solutions",
              "GreenGrid Energy",
              "Orbit Laboratories",
              "InsightWorks Consulting",
              "RapidScale Technologies",
              "BlueOrbit Systems",
            ].map((brand) => (
              <li
                key={brand}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm"
              >
                {brand}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24" id="solutions">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Featured Enterprise Solutions
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Discover our most requested enterprise-grade devices, thoroughly
              tested and certified for business deployment.
            </p>
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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
              <PackageCheck className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-lg font-medium">
                Solutions catalog loading...
              </p>
              <p className="text-sm mt-2">
                New enterprise inventory will be displayed here once available.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24" id="categories">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Enterprise Product Categories
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Comprehensive technology solutions designed for finance,
              engineering, creative, and operational teams.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {categories.map(({ name, description, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-800">
                      {name}
                    </h3>
                    <p className="mt-3 text-base text-slate-600 leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <div className="ml-6 flex-shrink-0">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                  <span>Explore Solutions</span>
                  <span
                    className="ml-2 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24" id="inventory">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Additional Enterprise Inventory
              </h2>
              <p className="text-lg text-slate-600">
                Carefully selected devices to complete your technology
                ecosystem.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-md border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Link href="/products">View Complete Catalog</Link>
            </Button>
          </div>
          {moreToExplore.length ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {moreToExplore.map((product) => (
                <div key={product.id} className="scroll-mt-24">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-500">
              <Laptop className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-lg font-medium">
                Expanding inventory selection...
              </p>
              <p className="text-sm mt-2">
                Additional enterprise products will be available here shortly.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24" id="services">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Enterprise Services & Support
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Comprehensive service offerings designed to support your
              organization's technology infrastructure and growth.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {services.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Icon className="h-8 w-8 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {title}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Trusted by Enterprise IT Leaders
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Our commitment to transparent device grading, predictable
              enterprise pricing, and dedicated support has established us as
              the preferred partner for thousands of successful technology
              deployments across diverse industries.
            </p>
            <div className="grid gap-6 sm:grid-cols-1">
              {testimonials.map((testimonial) => (
                <figure
                  key={testimonial.author}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm"
                >
                  <blockquote className="text-base text-slate-700 leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <figcaption className="text-sm font-semibold text-slate-900">
                    {testimonial.author}
                    <span className="font-normal text-slate-600">
                      {" "}
                      · {testimonial.role}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Scale Your Technology?
            </h3>
            <p className="text-base text-slate-600 mb-8 leading-relaxed">
              Partner with our enterprise specialists for custom deployment
              solutions, asset management, and strategic lifecycle planning
              tailored to your organization's unique requirements.
            </p>
            <div className="space-y-4">
              <Button
                asChild
                size="lg"
                className="w-full rounded-md bg-slate-900 hover:bg-slate-800 text-base font-semibold"
              >
                <Link href="/register">Schedule Enterprise Consultation</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-md border-slate-300 text-slate-700 hover:bg-slate-50 text-base font-semibold"
              >
                <Link href="/login">Access Customer Portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
