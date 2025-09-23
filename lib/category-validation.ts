import { z } from "zod";

export const categoryPayloadSchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(120, "Category name must be under 120 characters"),
  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .optional()
    .transform((value) => value?.trim() ?? ""),
});

export type CategoryPayload = z.infer<typeof categoryPayloadSchema>;
