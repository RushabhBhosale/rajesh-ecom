import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive().max(10),
});

export const checkoutPayloadSchema = z.object({
  customerName: z.string().min(2, "Enter your full name"),
  customerEmail: z.string().email("Enter a valid email"),
  customerPhone: z
    .string()
    .min(10, "Enter a valid phone number")
    .max(20, "Enter a valid phone number"),
  addressLine1: z.string().min(3, "Address line 1 is required"),
  addressLine2: z.string().optional().default(""),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z
    .string()
    .min(4, "Enter a valid postal code")
    .max(10, "Enter a valid postal code"),
  country: z.string().min(2, "Country is required").default("India"),
  paymentMethod: z.enum(["cod", "razorpay"]),
  notes: z.string().optional(),
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
});

export const razorpayVerificationSchema = z.object({
  orderId: z.string().min(1, "Order id is required"),
  razorpayPaymentId: z.string().min(1, "Payment id is required"),
  razorpayOrderId: z.string().min(1, "Razorpay order id is required"),
  razorpaySignature: z.string().min(1, "Signature is required"),
});
