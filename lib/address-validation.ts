import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().max(80).optional().default(""),
  recipientName: z.string().trim().min(2, "Recipient name is required"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(20, "Enter a valid phone number"),
  line1: z.string().trim().min(3, "Address line 1 is required"),
  line2: z.string().trim().optional().default(""),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  postalCode: z.string().trim().min(4, "Enter a valid postal code").max(10, "Enter a valid postal code"),
  country: z.string().trim().min(2, "Country is required").default("India"),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
