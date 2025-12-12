import { z } from "zod";

import {
  MAX_PRODUCT_HIGHLIGHTS,
  productConditions,
} from "@/lib/product-constants";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function isRelativeUpload(path: string) {
  return path.startsWith("/uploads/");
}

export function validateUrlOrUpload(value: string) {
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
  name: z
    .string()
    .trim()
    .max(200, "Name should be under 200 characters")
    .optional()
    .default(""),
  category: z.string().min(2, "Category must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  sku: z
    .string()
    .trim()
    .max(120, "SKU should be under 120 characters")
    .optional()
    .default(""),
  stock: z.coerce
    .number()
    .min(0, "Stock must be 0 or greater")
    .optional()
    .default(1),
  condition: z.enum(productConditions),
  companyId: z
    .union([
      z.string().trim().regex(objectIdRegex, "Select a valid company"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  companySubMasterId: z
    .union([
      z
        .string()
        .trim()
        .regex(objectIdRegex, "Select a valid company submaster"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  processorId: z
    .union([
      z.string().trim().regex(objectIdRegex, "Select a valid processor"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  processorSubMasterId: z
    .union([
      z
        .string()
        .trim()
        .regex(objectIdRegex, "Select a valid processor submaster"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  ramId: z
    .union([
      z.string().trim().regex(objectIdRegex, "Select a valid RAM"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  ramSubMasterId: z
    .union([
      z.string().trim().regex(objectIdRegex, "Select a valid RAM submaster"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  storageId: z
    .union([
      z.string().trim().regex(objectIdRegex, "Select a valid storage option"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  storageSubMasterId: z
    .union([
      z
        .string()
        .trim()
        .regex(objectIdRegex, "Select a valid storage submaster"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  graphicsId: z
    .union([
      z.string().trim().regex(objectIdRegex, "Select a valid graphics option"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  graphicsSubMasterId: z
    .union([
      z
        .string()
        .trim()
        .regex(objectIdRegex, "Select a valid graphics submaster"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  osId: z
    .union([
      z.string().trim().regex(objectIdRegex, "Select a valid operating system"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
  osSubMasterId: z
    .union([
      z.string().trim().regex(objectIdRegex, "Select a valid OS submaster"),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (val ? val : undefined)),
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
  variants: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, "Variant label cannot be empty")
          .max(120),
        price: z.coerce.number().min(0, "Variant price must be 0 or greater"),
        description: z
          .string()
          .trim()
          .max(5000, "Variant description is too long")
          .optional()
          .default(""),
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
          .max(12, "You can add up to 12 gallery images per variant")
          .optional()
          .default([]),
        condition: z
          .enum(productConditions)
          .optional()
          .transform((val) => (val ? val : undefined)),
        sku: z
          .string()
          .trim()
          .max(120, "SKU should be under 120 characters")
          .optional()
          .default(""),
        stock: z.coerce
          .number()
          .min(0, "Stock must be 0 or greater")
          .optional()
          .default(1),
        processorId: z
          .union([
            z.string().trim().regex(objectIdRegex, "Select a valid processor"),
            z.literal(""),
          ])
          .optional()
          .transform((val) => (val ? val : undefined)),
        ramId: z
          .union([
            z.string().trim().regex(objectIdRegex, "Select a valid RAM option"),
            z.literal(""),
          ])
          .optional()
          .transform((val) => (val ? val : undefined)),
        storageId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid storage option"),
            z.literal(""),
          ])
          .optional()
          .transform((val) => (val ? val : undefined)),
        graphicsId: z
          .union([
            z
              .string()
              .trim()
              .regex(objectIdRegex, "Select a valid graphics option"),
            z.literal(""),
          ])
          .optional()
          .transform((val) => (val ? val : undefined)),
        color: z
          .string()
          .trim()
          .max(80, "Colour name should be under 80 characters")
          .optional()
          .transform((val) => (val ? val : undefined)),
      })
    )
    .max(30, "Too many variants")
    .optional()
    .default([]),
  colors: z
    .array(z.string().min(1, "Colour name cannot be empty"))
    .max(1, "Only one colour allowed. Add more colours as variants.")
    .optional()
    .default([]),
});

export type ProductPayload = z.infer<typeof productPayloadSchema>;
