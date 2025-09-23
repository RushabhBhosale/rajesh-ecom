"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_PRODUCT_HIGHLIGHTS, productConditions } from "@/lib/product-constants";
import type { ProductSummary } from "@/lib/products";

interface ProductFormProps {
  mode: "create" | "update";
  product?: ProductSummary;
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectTo?: string;
}

const conditionLabels: Record<(typeof productConditions)[number], string> = {
  refurbished: "Certified refurbished",
  new: "Brand new",
};

type ProductFormValues = {
  name: string;
  category: string;
  description: string;
  price: number;
  condition: (typeof productConditions)[number];
  imageUrl: string;
  featured: boolean;
  inStock: boolean;
  highlights: string;
};

export function ProductForm({ mode, product, onSuccess, onCancel, redirectTo }: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        category: z.string().min(2, "Category must be at least 2 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        price: z.coerce.number().min(0, "Price must be 0 or greater"),
        condition: z.enum(productConditions),
        imageUrl: z
          .string()
          .url("Enter a valid URL")
          .or(z.literal(""))
          .default(""),
        featured: z.boolean().default(false),
        inStock: z.boolean().default(true),
        highlights: z
          .string()
          .max(800, "Highlights should be under 800 characters")
          .optional()
          .default(""),
      }),
    []
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      condition: product?.condition ?? "refurbished",
      imageUrl: product?.imageUrl ?? "",
      featured: product?.featured ?? false,
      inStock: product?.inStock ?? true,
      highlights: product?.highlights?.join("\n") ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const submitHandler = handleSubmit(async (values) => {
    setServerError(null);

    const highlights = values.highlights
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (highlights.length > MAX_PRODUCT_HIGHLIGHTS) {
      setServerError(`You can add up to ${MAX_PRODUCT_HIGHLIGHTS} highlights.`);
      return;
    }

    const payload = {
      name: values.name,
      category: values.category,
      description: values.description,
      price: values.price,
      condition: values.condition,
      imageUrl: values.imageUrl,
      featured: values.featured,
      inStock: values.inStock,
      highlights,
    };

    try {
      const endpoint = mode === "create" ? "/api/products" : `/api/products/${product?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error
          ? typeof data.error === "string"
            ? data.error
            : Object.values<string[]>(data.error)[0]?.[0] ?? "Unable to save product"
          : "Unable to save product";
        setServerError(message);
        toast.error(message);
        return;
      }

      toast.success(mode === "create" ? "Product created" : "Product updated");
      if (mode === "create") {
        reset({
          name: "",
          category: "",
          description: "",
          price: 0,
          condition: "refurbished",
          imageUrl: "",
          featured: false,
          inStock: true,
          highlights: "",
        });
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
      const message = "Unable to reach the server. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  });

  const title = mode === "create" ? "Add a new product" : `Update ${product?.name ?? "product"}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in product details to showcase laptops and electronics in the storefront.
        </p>
      </CardHeader>
      <form onSubmit={submitHandler} className="space-y-6">
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" placeholder="ThinkPad X1 Carbon" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" placeholder="Ultrabook" {...register("category")} />
            {errors.category ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.category.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" type="number" step="0.01" min="0" {...register("price", { valueAsNumber: true })} />
            {errors.price ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.price.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <select
              id="condition"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              {...register("condition")}
            >
              {productConditions.map((condition) => (
                <option key={condition} value={condition}>
                  {conditionLabels[condition]}
                </option>
              ))}
            </select>
            {errors.condition ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.condition.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" placeholder="https://images.example.com/device.jpg" {...register("imageUrl")} />
            {errors.imageUrl ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.imageUrl.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Share the device story, refurbishment process, and warranty coverage."
              className="min-h-[140px]"
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="highlights">Highlights</Label>
            <Textarea
              id="highlights"
              placeholder={`Add up to ${MAX_PRODUCT_HIGHLIGHTS} bullet points. Enter one per line.`}
              className="min-h-[120px]"
              {...register("highlights")}
            />
            <p className="text-xs text-muted-foreground">
              Showcase key selling points, warranty terms, or bundled accessories.
            </p>
            {errors.highlights ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.highlights.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-6 sm:col-span-2 sm:flex-row">
            <label className="flex items-center gap-3 rounded-lg border border-input bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
              <input
                type="checkbox"
                className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                {...register("featured")}
              />
              Highlight on landing page
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-input bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
              <input
                type="checkbox"
                className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                {...register("inStock")}
              />
              Available in stock
            </label>
          </div>
          {serverError ? (
            <div className="sm:col-span-2">
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col justify-end gap-3 sm:flex-row">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" className="sm:ml-auto" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
