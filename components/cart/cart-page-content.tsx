"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useCart } from "./cart-provider";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CartPageContent() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  if (itemCount === 0) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 px-4 py-20 text-center">
        <div className="space-y-4">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Your cart is empty
          </span>
          <h1 className="text-4xl font-semibold text-foreground">Let’s find something for your team</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Add refurbished laptops, tablets, and accessories to build a deployment-ready cart. You can manage quantities and checkout when you’re ready.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/products">Browse products</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start">
      <div className="flex-1 space-y-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Cart summary</CardTitle>
              <p className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"} selected</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => clearCart()}>
              Clear cart
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/50 p-4 sm:flex-row sm:items-center">
                <div className="relative h-28 w-full overflow-hidden rounded-lg bg-secondary sm:h-24 sm:w-32">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 160px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{item.condition.replace("-", " ")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Unit price</p>
                      <p className="text-base font-semibold text-primary">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`quantity-${item.id}`} className="text-xs uppercase text-muted-foreground">
                        Quantity
                      </label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => {
                          const nextValue = Number.parseInt(event.target.value, 10);
                          updateQuantity(item.id, Number.isNaN(nextValue) ? 1 : Math.max(1, nextValue));
                        }}
                        className="h-9 w-20 rounded-full text-center"
                      />
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs uppercase text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="self-start" onClick={() => removeItem(item.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <aside className="w-full max-w-md space-y-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="text-xl">Order estimate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-base font-semibold text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and taxes are calculated during checkout once delivery preferences are confirmed.
            </p>
          </CardContent>
          <Separator className="bg-border/80" />
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full rounded-full py-5 text-base">Proceed to checkout</Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="border-border/70 bg-gradient-to-br from-secondary/70 via-background to-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Need a tailored quote?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Our procurement team can help with bulk pricing, deployment kits, and asset tagging. Share your requirements and we’ll respond within one business day.
            </p>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/register">Connect with sales</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}

