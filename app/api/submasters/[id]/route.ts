import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { subMasterPayloadSchema, subMasterIdSchema } from "@/lib/submaster-validation";
import { MasterOptionModel } from "@/models/master-option";
import { SubMasterOptionModel } from "@/models/sub-master-option";

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

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const { params } = context;
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid submaster id" }, { status: 400 });
    }

    const auth = await ensureAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const payload = subMasterPayloadSchema.parse(await request.json());
    const id = subMasterIdSchema.parse(params.id);

    await connectDB();

    const parent = await MasterOptionModel.findById(payload.masterId).lean();
    if (!parent) {
      return NextResponse.json({ error: "Parent master not found" }, { status: 404 });
    }

    const existing = await SubMasterOptionModel.findOne({
      _id: { $ne: id },
      masterId: payload.masterId,
      name: payload.name,
    }).lean();

    if (existing) {
      return NextResponse.json(
        { error: `${parent.name} already has this submaster` },
        { status: 409 },
      );
    }

    const updated = await SubMasterOptionModel.findByIdAndUpdate(
      id,
      {
        $set: {
          masterId: payload.masterId,
          masterType: parent.type,
          name: payload.name,
          description: payload.description ?? "",
          sortOrder: payload.sortOrder ?? 0,
        },
      },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "Submaster not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Submaster updated" });
  } catch (error) {
    console.error("Update submaster failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Unable to update submaster option" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    const { params } = context;
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid submaster id" }, { status: 400 });
    }

    const auth = await ensureAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    await connectDB();
    const deleted = await SubMasterOptionModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Submaster not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Submaster deleted" });
  } catch (error) {
    console.error("Delete submaster failed", error);
    return NextResponse.json(
      { error: "Unable to delete submaster option" },
      { status: 500 },
    );
  }
}
