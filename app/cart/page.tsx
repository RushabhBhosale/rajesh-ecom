"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShoppingCart } from "lucide-react";

import { CartLineItem } from "@/components/cart/cart-line-item";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import {
  useCartStore,
  useCartHydration,
  selectCartItems,
  selectItemCount,
  selectSubtotal,
} from "@/lib/stores/cart-store";

export default function CartPage() {
  const hydrated = useCartHydration();
  const items = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectSubtotal);
  const itemCount = useCartStore(selectItemCount);
  const clearCart = useCartStore((state) => state.clearCart);

  const gstEstimate = subtotal * 0.18;
  const orderTotal = subtotal + gstEstimate;

  if (!hydrated) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
          <p className="text-sm font-medium text-slate-600">
            Loading your cart…
          </p>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
          <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white shadow-sm">
            <ShoppingCart className="h-10 w-10 text-slate-400" />
          </div>
          <h1 className="mt-8 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Your cart is currently empty
          </h1>
          <p className="mt-4 max-w-lg text-base text-slate-600">
            Explore our enterprise-ready devices and add them to your cart to
            build a deployment-ready order.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/products">Browse products</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-slate-300"
            >
              <Link href="/">Return home</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-20">
      <section className="border-b border-slate-200/80 bg-white/90 py-12 backdrop-blur">
        <div className="mx-auto flex max-w-[90vw] flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Procurement Cart
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Review and finalize your selection
            </h1>
            <p className="text-base text-slate-600">
              {itemCount} item{itemCount === 1 ? "" : "s"} ready for fast
              dispatch with nationwide logistics support.
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="self-start text-slate-500 hover:text-slate-900"
          >
            <Link href="/products" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>
          </Button>
        </div>
      </section>

      <div className="mx-auto mt-10 grid w-full max-w-[90vw] gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {items.map((item) => (
            <CartLineItem key={item.productId} item={item} />
          ))}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-sm text-slate-600">
              Need to adjust quantities later? You can save your selection and
              resume checkout anytime.
            </p>
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-red-600"
              onClick={clearCart}
            >
              Clear cart
            </Button>
          </div>
        </div>

        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Order summary
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pricing tailored for enterprise deployments with complimentary
              logistics coordination.
            </p>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>GST Estimate (18%)</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(gstEstimate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-emerald-600">
                Complimentary
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-base font-semibold text-slate-600">
              Total
            </span>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(orderTotal)}
            </span>
          </div>

          <div className="space-y-4">
            <Button asChild size="lg" className="w-full rounded-full">
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              <span>
                Need a formal quote or purchase order? Our team will finalize
                billing terms within 24 hours once you submit your cart.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
