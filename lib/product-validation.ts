import { z } from "zod";

import { MAX_PRODUCT_HIGHLIGHTS, productConditions } from "@/lib/product-constants";

export const productPayloadSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string().min(2, "Category must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  condition: z.enum(productConditions),
  imageUrl: z
    .string()
    .url("Enter a valid image URL")
    .or(z.literal(""))
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
});

export type ProductPayload = z.infer<typeof productPayloadSchema>;
