import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { groupMasterOptions, listMasterOptions, masterFieldToLabel } from "@/lib/master-options";
import { masterTypes, type MasterOptionType } from "@/lib/master-constants";
import { masterOptionPayloadSchema } from "@/lib/master-validation";
import { MasterOptionModel } from "@/models/master-option";

function parseTypesParam(value: string | null): MasterOptionType[] | undefined {
  if (!value) {
    return undefined;
  }
  const requested = value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is MasterOptionType => masterTypes.includes(item as MasterOptionType));
  return requested.length ? requested : undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const types = parseTypesParam(url.searchParams.get("types"));
    const options = await listMasterOptions(types);
    return NextResponse.json({ masters: groupMasterOptions(options) });
  } catch (error) {
    console.error("Failed to list masters", error);
    return NextResponse.json({ error: "Unable to load master options" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = masterOptionPayloadSchema.parse(await request.json());

    await connectDB();
    const existing = await MasterOptionModel.findOne({
      type: payload.type,
      name: payload.name,
    }).lean();

    if (existing) {
      return NextResponse.json(
        { error: `${masterFieldToLabel(payload.type)} already exists` },
        { status: 409 }
      );
    }

    await MasterOptionModel.create({
      type: payload.type,
      name: payload.name,
      description: payload.description ?? "",
      sortOrder: payload.sortOrder ?? 0,
    });

    return NextResponse.json({ message: "Master created" }, { status: 201 });
  } catch (error) {
    console.error("Create master failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create master option" }, { status: 500 });
  }
}
