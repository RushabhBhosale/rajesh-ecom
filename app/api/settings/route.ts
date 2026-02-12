import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { defaultStoreSettings, normalizeStoreSettings } from "@/lib/store-settings";
import { getStoreSettings, updateStoreSettings } from "@/lib/store-settings/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const numericInput = (max?: number) =>
  z
    .preprocess(
      (value) => {
        if (value === undefined || value === null || value === "") {
          return undefined;
        }
        if (typeof value === "string" && value.trim().length > 0) {
          return Number(value);
        }
        return value;
      },
      max ? z.number().min(0).max(max) : z.number().min(0)
    )
    .optional();

const settingsSchema = z.object({
  gstEnabled: z.boolean().optional(),
  gstRate: numericInput(100), // percentage 0-100
  shippingEnabled: z.boolean().optional(),
  shippingAmount: numericInput(),
  topBarEnabled: z.boolean().optional(),
  topBarMessage: z.string().trim().max(140).optional(),
  topBarCtaText: z.string().trim().max(60).optional(),
  topBarCtaHref: z.string().trim().max(300).optional(),
});

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json(
      { settings },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Failed to load store settings", error);
    return NextResponse.json(
      { settings: defaultStoreSettings },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = settingsSchema.parse(await request.json());
    const settings = await updateStoreSettings(normalizeStoreSettings(payload));
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to update store settings", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update settings" }, { status: 500 });
  }
}
