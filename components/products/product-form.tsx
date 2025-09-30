"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_PRODUCT_HIGHLIGHTS,
  productConditions,
} from "@/lib/product-constants";
import type { ProductSummary } from "@/lib/products";
import type { CategorySummary } from "@/lib/categories";
import { RichTextEditor } from "@/components/products/rich-text-editor";

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
  colors: string;
  galleryImages: { url: string }[];
  richDescription: string;
};

export function ProductForm({
  mode,
  product,
  onSuccess,
  onCancel,
  redirectTo,
}: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Pick<CategorySummary, "id" | "name">[]
  >([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  const [galleryUploadingIndex, setGalleryUploadingIndex] = useState<number | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        category: z.string().min(2, "Category must be at least 2 characters"),
        description: z
          .string()
          .min(10, "Description must be at least 10 characters"),
        price: z.coerce.number().min(0, "Price must be 0 or greater"),
        condition: z.enum(productConditions),
        imageUrl: z
          .string()
          .trim()
          .superRefine((val, ctx) => {
            if (!val) {
              return;
            }
            if (val.startsWith("/uploads/")) {
              return;
            }
            try {
              // eslint-disable-next-line no-new
              new URL(val);
            } catch {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid URL or upload an image" });
            }
          })
          .default(""),
        galleryImages: z
          .array(
            z.object({
              url: z
                .string()
                .trim()
                .superRefine((val, ctx) => {
                  if (!val) {
                    return;
                  }
                  if (val.startsWith("/uploads/")) {
                    return;
                  }
                  try {
                    new URL(val);
                  } catch {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid URL or upload an image" });
                  }
                })
                .default(""),
            })
          )
          .max(12, "You can add up to 12 gallery images"),
        richDescription: z
          .string()
          .max(20000, "Rich description is too long")
          .default(""),
        featured: z.boolean().default(false),
        inStock: z.boolean().default(true),
        highlights: z
          .string()
          .max(800, "Highlights should be under 800 characters")
          .optional()
          .default(""),
        colors: z
          .string()
          .max(400, "Colours should be under 400 characters")
          .optional()
          .default(""),
      }),
    []
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      condition: product?.condition ?? "refurbished",
      imageUrl: product?.imageUrl ?? "",
      galleryImages:
        product?.galleryImages?.map((url) => ({ url }))?.slice(0, 12) ?? [],
      richDescription: product?.richDescription ?? "",
      featured: product?.featured ?? false,
      inStock: product?.inStock ?? true,
      highlights: product?.highlights?.join("\n") ?? "",
      colors: product?.colors?.join("\n") ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const {
    fields: galleryFields,
    append: appendGallery,
    remove: removeGallery,
  } = useFieldArray({
    control,
    name: "galleryImages",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setIsLoadingCategories(true);
      setCategoriesError(null);

      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json().catch(() => null);
        const fetched: Pick<CategorySummary, "id" | "name">[] = Array.isArray(
          data?.categories
        )
          ? data.categories.filter(
              (item: unknown): item is Pick<CategorySummary, "id" | "name"> =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as CategorySummary).id === "string" &&
                typeof (item as CategorySummary).name === "string"
            )
          : [];

        if (cancelled) {
          return;
        }

        setCategories(fetched);

        const currentCategory = getValues("category");
        const hasCurrentInFetched = fetched.some(
          (category) => category.name === currentCategory
        );
        if ((!currentCategory || !hasCurrentInFetched) && fetched.length > 0) {
          setValue("category", fetched[0].name, { shouldValidate: true });
        }
      } catch (error) {
        console.error(error);
        if (cancelled) {
          return;
        }
        setCategories([]);
        setCategoriesError(
          "Unable to load categories. Please refresh and try again."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [getValues, setValue]);

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

    const rawColors = values.colors
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const uniqueColors = rawColors.filter(
      (item, index) =>
        rawColors.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index
    );

    if (values.colors.trim() && uniqueColors.length === 0) {
      setServerError("Please enter at least one colour or leave the field empty.");
      return;
    }

    if (uniqueColors.length > 12) {
      setServerError("You can add up to 12 colours.");
      return;
    }

    const colors = uniqueColors;

    const galleryImages = values.galleryImages
      .map((entry) => entry.url.trim())
      .filter((url, index, arr) => url.length > 0 && arr.indexOf(url) === index)
      .slice(0, 12);

    const payload = {
      name: values.name,
      category: values.category,
      description: values.description,
      price: values.price,
      condition: values.condition,
      imageUrl: values.imageUrl,
      galleryImages,
      richDescription: values.richDescription.trim(),
      featured: values.featured,
      inStock: values.inStock,
      highlights,
      colors,
    };

    try {
      const endpoint =
        mode === "create" ? "/api/products" : `/api/products/${product?.id}`;
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
            : Object.values<string[]>(data.error)[0]?.[0] ??
              "Unable to save product"
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
          galleryImages: [],
          richDescription: "",
          featured: false,
          inStock: true,
          highlights: "",
          colors: "",
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

  const title =
    mode === "create"
      ? "Add a new product"
      : `Update ${product?.name ?? "product"}`;

  async function uploadImageFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/images", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "Upload failed");
    }

    const data = (await response.json()) as { url: string };
    return data.url;
  }

  async function handlePrimaryFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setIsUploadingPrimary(true);
      const url = await uploadImageFile(file);
      setValue("imageUrl", url, { shouldValidate: true });
      toast.success("Primary image uploaded");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploadingPrimary(false);
      event.target.value = "";
    }
  }

  async function handleGalleryFileChange(
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setGalleryUploadingIndex(index);
      const url = await uploadImageFile(file);
      setValue(`galleryImages.${index}.url`, url, { shouldValidate: true });
      toast.success("Gallery image uploaded");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setGalleryUploadingIndex(null);
      event.target.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in product details to showcase laptops and electronics in the
          storefront.
        </p>
      </CardHeader>
      <form onSubmit={submitHandler} className="space-y-6">
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Product name</Label>
            <Input
              id="name"
              placeholder="ThinkPad X1 Carbon"
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-3 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Gallery images</Label>
                <p className="text-xs text-muted-foreground">
                  Add alternate angles, lifestyle shots, or packaging imagery.
                  Provide secure (https) links; the first three appear below the
                  main photo on the product page.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendGallery({ url: "" })}
                disabled={galleryFields.length >= 12}
              >
                Add image
              </Button>
            </div>
            <div className="space-y-3">
              {galleryFields.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No gallery media yet.
                </p>
              ) : null}
              {galleryFields.map((field, index) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="https://images.example.com/gallery.jpg"
                      {...register(`galleryImages.${index}.url`)}
                      aria-invalid={Boolean(errors.galleryImages?.[index]?.url)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGallery(index)}
                      aria-label="Remove gallery image"
                    >
                      ×
                    </Button>
                    <label className="inline-flex cursor-pointer items-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleGalleryFileChange(event, index)}
                        disabled={galleryUploadingIndex === index}
                      />
                      <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                        {galleryUploadingIndex === index ? "Uploading…" : "Choose"}
                      </span>
                    </label>
                  </div>
                  {errors.galleryImages?.[index]?.url?.message ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.galleryImages[index]?.url?.message}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              disabled={isLoadingCategories || categories.length === 0}
              {...register("category")}
            >
              {isLoadingCategories ? (
                <option value="">Loading categories...</option>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option value="">No categories available</option>
              )}
            </select>
            {errors.category ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.category.message}
              </p>
            ) : null}
            {categoriesError ? (
              <p className="text-xs text-destructive" role="alert">
                {categoriesError}
              </p>
            ) : null}
            {!isLoadingCategories &&
            categories.length === 0 &&
            !categoriesError ? (
              <p className="text-xs text-muted-foreground">
                Create categories first so products can be assigned correctly.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register("price", { valueAsNumber: true })}
            />
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
            <Label htmlFor="imageUrl">Primary image URL</Label>
            <Input
              id="imageUrl"
              placeholder="https://images.example.com/device.jpg"
              {...register("imageUrl")}
            />
            {errors.imageUrl ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.imageUrl.message}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Shown on listing cards and as the default hero image. Use a
              1200×900px (or similar) high-quality photo.
            </p>
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePrimaryFileChange}
                  disabled={isUploadingPrimary}
                />
                <span className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  {isUploadingPrimary ? "Uploading…" : "Choose file"}
                </span>
              </label>
              <span className="text-xs text-muted-foreground">
                {isUploadingPrimary ? "Uploading image…" : "Upload directly from your computer."}
              </span>
            </div>
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
            <p className="text-xs text-muted-foreground">
              Appears near the top of the detail page and in product teasers.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="richDescription">Rich product story</Label>
            <Controller
              control={control}
              name="richDescription"
              render={({ field: { value, onChange } }) => (
                <RichTextEditor
                  value={value!}
                  onChange={onChange}
                  placeholder="Start writing... add images, videos, and formatted text."
                />
              )}
            />
            {errors.richDescription ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.richDescription.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="colors">Colour options</Label>
            <Textarea
              id="colors"
              placeholder="Enter one colour per line or separate with commas."
              className="min-h-[80px]"
              {...register("colors")}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if the product has no colour variations.
            </p>
            {errors.colors ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.colors.message}
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
              Showcase key selling points, warranty terms, or bundled
              accessories.
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
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" className="sm:ml-auto" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Create product"
              : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
