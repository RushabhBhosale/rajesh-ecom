import Link from "next/link";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/products";

export const metadata = {
  title: "Products",
  description: "Explore refurbished laptops, tablets, and accessories ready to ship.",
};

export default async function ProductsPage() {
  const products = await listProducts({});

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/20),transparent_55%)]" />
        <div className="mx-auto max-w-5xl space-y-8 px-6 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-secondary px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground">
            Available inventory
          </span>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Your next device, renewed</h1>
          <p className="text-lg text-muted-foreground">
            Each product listed here has been professionally refurbished, data-wiped, and certified for
            business-ready deployment. Filter by category to find the right fit for your team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="#catalogue">Shop inventory</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Request procurement help</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-24" id="catalogue">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Certified catalogue</h2>
            <p className="text-muted-foreground">
              Laptops, tablets, monitors, and accessories—all renewed, stress-tested, and backed by
              warranty.
            </p>
          </div>
          {products.length ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} id={product.id} className="scroll-mt-24">
                  <ProductCard product={product} showCta={false} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/30 px-6 py-16 text-center text-muted-foreground">
              No products available yet. Add items from the admin dashboard to populate the catalogue.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
