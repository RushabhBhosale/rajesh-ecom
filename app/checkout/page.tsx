import { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { brandName } from "@/utils/variable";

export const metadata: Metadata = {
  title: `Checkout | ${brandName}`,
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/checkout");
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-20">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <section className="border-b border-slate-200/80 bg-white/90 py-12 backdrop-blur">
        <div className="mx-auto flex max-w-[90vw] flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Secure Checkout
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Finalise your Order
            </h1>
            <p className="text-base text-slate-600">
              Confirm delivery details and choose how you’d like to settle
              payment.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 w-full max-w-[90vw] px-4 sm:px-6">
        <CheckoutForm />
      </div>
    </main>
  );
}
