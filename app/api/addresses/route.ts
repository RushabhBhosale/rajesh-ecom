import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { addressSchema } from "@/lib/address-validation";
import { createAddress, listAddresses } from "@/lib/addresses";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await listAddresses(user.id);
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("List addresses failed", error);
    return NextResponse.json({ error: "Unable to load addresses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = addressSchema.parse(await request.json());
    const address = await createAddress(user.id, payload);
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Create address failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create address" }, { status: 500 });
  }
}
