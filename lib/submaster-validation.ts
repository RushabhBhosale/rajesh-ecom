import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const subMasterPayloadSchema = z.object({
  masterId: z
    .string()
    .trim()
    .regex(objectIdRegex, "Select a valid master"),
  parentId: z
    .union([z.string().trim().regex(objectIdRegex, "Select a valid parent"), z.literal(""), z.null()])
    .optional()
    .transform((val) => (val ? val : undefined)),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Keep names concise"),
  description: z
    .string()
    .trim()
    .max(500, "Description should be under 500 characters")
    .optional()
    .default(""),
  sortOrder: z
    .number()
    .int("Sort order must be an integer")
    .min(0, "Sort order cannot be negative")
    .max(10000, "Sort order is too large")
    .optional()
    .default(0),
});

export const subMasterIdSchema = z
  .string()
  .trim()
  .regex(objectIdRegex, "Invalid submaster id");
