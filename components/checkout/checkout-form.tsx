"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { checkoutPayloadSchema } from "@/lib/checkout-validation";
import { formatCurrency } from "@/lib/currency";
import {
  useCartHydration,
  useCartStore,
  selectCartItems,
  selectSubtotal,
} from "@/lib/stores/cart-store";

declare global {
  interface Window {
    Razorpay: undefined |
      (new (options: any) => {
        open: () => void;
        on: (event: string, handler: () => void) => void;
        close: () => void;
      });
  }
}

const formSchema = checkoutPayloadSchema.omit({ items: true });
type CheckoutFormValues = z.infer<typeof formSchema>;

type SuccessState = {
  orderId: string;
  paymentMethod: "cod" | "razorpay";
  message: string;
  paymentReference?: string;
};

const TAX_RATE = 0.18;

export function CheckoutForm() {
  const router = useRouter();
  const cartHydrated = useCartHydration();
  const items = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectSubtotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);

  const tax = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      paymentMethod: "cod",
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = form;

  const paymentMethod = watch("paymentMethod");

  function getErrorMessage(error: unknown) {
    if (!error) {
      return "Unable to place order";
    }
    if (typeof error === "string") {
      return error;
    }
    if (typeof error === "object" && error !== null) {
      for (const value of Object.values(error)) {
        if (Array.isArray(value) && value.length > 0) {
          return String(value[0]);
        }
        if (typeof value === "string") {
          return value;
        }
      }
    }
    return "Unable to place order";
  }

  async function verifyRazorpayPayment({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    try {
      const response = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Payment verification failed");
      }

      setSuccess({
        orderId,
        paymentMethod: "razorpay",
        message: "Payment received. We have started processing your order.",
        paymentReference: razorpayPaymentId,
      });
      clearCart();
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Payment verification failed");
    } finally {
      setPaymentPending(false);
    }
  }

  function openRazorpayCheckout(orderResponse: {
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    razorpayKey: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  }) {
    if (typeof window === "undefined" || !window.Razorpay) {
      toast.error("Unable to load Razorpay checkout. Please try again.");
      setPaymentPending(false);
      return;
    }

    const orderNumber = orderResponse.orderId.slice(-6).toUpperCase();

    const razorpay = new window.Razorpay({
      key: orderResponse.razorpayKey,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      name: "Rajesh Renewed",
      description: `Order ${orderNumber}`,
      order_id: orderResponse.razorpayOrderId,
      prefill: {
        name: orderResponse.customer.name,
        email: orderResponse.customer.email,
        contact: orderResponse.customer.phone,
      },
      notes: {
        orderId: orderResponse.orderId,
      },
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        setPaymentPending(true);
        void verifyRazorpayPayment({
          orderId: orderResponse.orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          setIsSubmitting(false);
          setPaymentPending(false);
        },
      },
      theme: {
        color: "#0f172a",
      },
    });

    razorpay.open();
  }

  const submitHandler = handleSubmit(async (values) => {
    if (!items.length) {
      toast.error("Your cart is empty. Add items before checking out.");
      return;
    }

    setIsSubmitting(true);
    setPaymentPending(false);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.color ?? null,
            variant: item.variant ?? null,
          })),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(getErrorMessage(data?.error));
        return;
      }

      if (values.paymentMethod === "cod") {
        setSuccess({
          orderId: data.orderId,
          paymentMethod: "cod",
          message: data.message ?? "Order placed successfully.",
        });
        clearCart();
        reset();
        return;
      }

      setPaymentPending(true);
      openRazorpayCheckout(data);
    } catch (error) {
      console.error(error);
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

  if (!cartHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
          <p className="text-sm font-medium text-slate-600">Loading your checkout…</p>
        </div>
      </div>
    );
  }

  if (success) {
    const shortOrder = success.orderId.slice(-6).toUpperCase();
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-lg">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          ✓
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">Thank you! Your order is confirmed.</h1>
        <p className="max-w-xl text-sm text-slate-600">
          Reference <span className="font-semibold text-slate-900">#{shortOrder}</span>. {success.message}
        </p>
        {success.paymentReference ? (
          <p className="text-xs text-slate-500">
            Payment reference {success.paymentReference}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/products">Continue shopping</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-lg">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          🛒
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Your cart is empty</h1>
        <p className="max-w-md text-sm text-slate-600">
          Add some devices to your cart to begin checkout.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submitHandler} className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Contact details</h1>
          <p className="text-sm text-slate-600">We’ll send confirmations and shipping updates.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="customerName">Full name</label>
            <Input id="customerName" placeholder="Rajesh Kumar" aria-invalid={Boolean(errors.customerName)} {...register("customerName")} />
            {errors.customerName ? (
              <p className="text-xs text-red-600">{errors.customerName.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="customerPhone">Phone number</label>
            <Input id="customerPhone" placeholder="9876543210" aria-invalid={Boolean(errors.customerPhone)} {...register("customerPhone")} />
            {errors.customerPhone ? (
              <p className="text-xs text-red-600">{errors.customerPhone.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="customerEmail">Email address</label>
          <Input id="customerEmail" type="email" placeholder="you@company.com" aria-invalid={Boolean(errors.customerEmail)} {...register("customerEmail")} />
          {errors.customerEmail ? (
            <p className="text-xs text-red-600">{errors.customerEmail.message}</p>
          ) : null}
        </div>

        <div className="space-y-6">
          <header className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900">Shipping address</h2>
            <p className="text-sm text-slate-600">We currently ship pan India with trusted logistics partners.</p>
          </header>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="addressLine1">Address line 1</label>
              <Input id="addressLine1" placeholder="Building, street" aria-invalid={Boolean(errors.addressLine1)} {...register("addressLine1")} />
              {errors.addressLine1 ? (
                <p className="text-xs text-red-600">{errors.addressLine1.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="addressLine2">Address line 2 (optional)</label>
              <Input id="addressLine2" placeholder="Landmark, floor" {...register("addressLine2")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="city">City</label>
                <Input id="city" placeholder="Mumbai" aria-invalid={Boolean(errors.city)} {...register("city")} />
                {errors.city ? <p className="text-xs text-red-600">{errors.city.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="state">State</label>
                <Input id="state" placeholder="Maharashtra" aria-invalid={Boolean(errors.state)} {...register("state")} />
                {errors.state ? <p className="text-xs text-red-600">{errors.state.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="postalCode">Postal code</label>
                <Input id="postalCode" placeholder="400001" aria-invalid={Boolean(errors.postalCode)} {...register("postalCode")} />
                {errors.postalCode ? (
                  <p className="text-xs text-red-600">{errors.postalCode.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="country">Country</label>
                <Input id="country" placeholder="India" aria-invalid={Boolean(errors.country)} {...register("country")} />
                {errors.country ? <p className="text-xs text-red-600">{errors.country.message}</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="notes">Order notes (optional)</label>
          <Textarea id="notes" placeholder="Share delivery instructions or GST details." rows={3} {...register("notes")} />
        </div>

        <div className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900">Payment method</h2>
            <p className="text-sm text-slate-600">Choose cash on delivery or secure Razorpay payment.</p>
          </header>

          <div className="grid gap-3 md:grid-cols-2">
            <label className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 shadow-sm transition ${
              paymentMethod === "cod" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
            }`}>
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Cash on delivery</span>
                <input
                  type="radio"
                  value="cod"
                  {...register("paymentMethod")}
                  className="size-4"
                />
              </div>
              <p className="text-xs text-slate-600">Pay on delivery with company cheque or card-on-delivery.</p>
            </label>
            <label className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 shadow-sm transition ${
              paymentMethod === "razorpay" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
            }`}>
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Razorpay (UPI / Cards)</span>
                <input
                  type="radio"
                  value="razorpay"
                  {...register("paymentMethod")}
                  className="size-4"
                />
              </div>
              <p className="text-xs text-slate-600">Instant online payment with receipt emailed instantly.</p>
            </label>
          </div>
          {errors.paymentMethod ? (
            <p className="text-xs text-red-600">{errors.paymentMethod.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Button type="button" variant="ghost" onClick={() => router.push("/cart")}>Back to cart</Button>
          <Button type="submit" size="lg" className="rounded-full px-8" disabled={isSubmitting || paymentPending}>
            {isSubmitting || paymentPending ? "Processing…" : paymentMethod === "cod" ? "Place order" : "Pay with Razorpay"}
          </Button>
        </div>
      </section>

      <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">Order summary</h2>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{items.length} item{items.length === 1 ? "" : "s"}</p>
        </header>

        <div className="space-y-4 divide-y divide-slate-200/80">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variant ?? "base"}-${item.color ?? "default"}`}
                className="flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  {item.variant ? (
                    <p className="text-xs text-slate-500"> {item.variant}</p>
                  ) : null}
                  {item.color ? (
                    <p className="text-xs text-slate-500">Colour: {item.color}</p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    Qty {item.quantity} · {formatCurrency(item.price)} each
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>GST (18%)</span>
              <span className="font-semibold text-slate-900">{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-emerald-600">Complimentary</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-base font-semibold text-slate-600">Total</span>
          <span className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          All orders include multi-point QA testing and 6-month enterprise warranty.
        </div>
      </aside>
    </form>
  );
}
