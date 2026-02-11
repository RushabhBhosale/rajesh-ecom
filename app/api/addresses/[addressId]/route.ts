import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { addressSchema } from "@/lib/address-validation";
import { deleteAddress, updateAddress } from "@/lib/addresses";

interface RouteParams {
  params: Promise<{ addressId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { addressId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = addressSchema.parse(await request.json());
    const updated = await updateAddress(user.id, addressId, payload);
    if (!updated) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    return NextResponse.json({ address: updated }, { status: 200 });
  } catch (error) {
    console.error("Update address failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update address" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { addressId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ok = await deleteAddress(user.id, addressId);
    if (!ok) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete address failed", error);
    return NextResponse.json({ error: "Unable to delete address" }, { status: 500 });
  }
}
