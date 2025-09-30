import { z } from "zod";

import { MAX_PRODUCT_HIGHLIGHTS, productConditions } from "@/lib/product-constants";

function isRelativeUpload(path: string) {
  return path.startsWith("/uploads/");
}

function validateUrlOrUpload(value: string) {
  if (!value) {
    return true;
  }
  if (isRelativeUpload(value)) {
    return true;
  }
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export const productPayloadSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string().min(2, "Category must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  condition: z.enum(productConditions),
  imageUrl: z
    .string()
    .trim()
    .refine(validateUrlOrUpload, "Enter a valid image URL or upload")
    .optional()
    .default(""),
  galleryImages: z
    .array(
      z
        .string()
        .trim()
        .refine(validateUrlOrUpload, "Enter a valid image URL or upload")
    )
    .max(12, "You can add up to 12 gallery images")
    .optional()
    .default([]),
  richDescription: z
    .string()
    .max(20000, "Rich description is too long")
    .optional()
    .default(""),
  featured: z.boolean().optional().default(false),
  inStock: z.boolean().optional().default(true),
  highlights: z
    .array(z.string().min(1, "Highlights cannot be empty"))
    .max(
      MAX_PRODUCT_HIGHLIGHTS,
      `You can add up to ${MAX_PRODUCT_HIGHLIGHTS} highlights`
    )
    .optional()
    .default([]),
  colors: z
    .array(z.string().min(1, "Colour name cannot be empty"))
    .max(12, "You can add up to 12 colours")
    .optional()
    .default([]),
});

export type ProductPayload = z.infer<typeof productPayloadSchema>;
