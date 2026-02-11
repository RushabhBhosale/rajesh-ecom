import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { masterFieldToLabel } from "@/lib/master-options";
import { masterIdSchema, masterOptionPayloadSchema } from "@/lib/master-validation";
import { MasterOptionModel } from "@/models/master-option";

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function ensureAdmin() {
  const actor = await getCurrentUser();
  if (!actor) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  if (actor.role !== "admin" && actor.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { actor } as const;
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid master id" }, { status: 400 });
    }

    const auth = await ensureAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const payload = masterOptionPayloadSchema.parse(await request.json());
    const masterId = masterIdSchema.parse(id);

    await connectDB();
    const existing = await MasterOptionModel.findOne({
      _id: { $ne: masterId },
      type: payload.type,
      name: payload.name,
    }).lean();

    if (existing) {
      return NextResponse.json(
        { error: `${masterFieldToLabel(payload.type)} already exists` },
        { status: 409 },
      );
    }

    const updated = await MasterOptionModel.findByIdAndUpdate(
      masterId,
      {
        $set: {
          type: payload.type,
          name: payload.name,
          description: payload.description ?? "",
          sortOrder: payload.sortOrder ?? 0,
        },
      },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "Master option not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Master updated" });
  } catch (error) {
    console.error("Update master failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update master option" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid master id" }, { status: 400 });
    }

    const auth = await ensureAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    await connectDB();
    const deleted = await MasterOptionModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Master option not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Master deleted" });
  } catch (error) {
    console.error("Delete master failed", error);
    return NextResponse.json({ error: "Unable to delete master option" }, { status: 500 });
  }
}
