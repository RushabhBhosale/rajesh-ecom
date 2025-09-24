import { CartPageContent } from "@/components/cart/cart-page-content";

export const metadata = {
  title: "Your cart",
  description: "Review selected refurbished devices and prepare for checkout.",
};

export default function CartPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/40 pb-12 pt-20 sm:pb-16 sm:pt-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,theme(colors.primary/25),transparent_60%)]" />
        <div className="mx-auto max-w-6xl space-y-6 px-4 text-center sm:px-6">
          <span className="inline-flex items-center justify-center rounded-full bg-secondary px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-secondary-foreground">
            Procurement cart
          </span>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Ready to deploy devices</h1>
          <p className="mx-auto max-w-3xl text-muted-foreground">
            Finalize your selections, adjust quantities, and move to checkout when your deployment list is complete.
          </p>
        </div>
      </section>
      <CartPageContent />
    </main>
  );
}

