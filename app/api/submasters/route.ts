import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { masterTypes, type MasterOptionType } from "@/lib/master-constants";
import {
  groupSubMasterOptions,
  listSubMasterOptions,
} from "@/lib/submaster-options";
import { subMasterPayloadSchema } from "@/lib/submaster-validation";
import { MasterOptionModel } from "@/models/master-option";
import { SubMasterOptionModel } from "@/models/sub-master-option";

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

function parseMasterIds(value: string | null): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const ids = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return ids.length ? ids : undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const types = parseTypesParam(url.searchParams.get("types"));
    const masterId = parseMasterIds(url.searchParams.get("masterId"));
    const options = await listSubMasterOptions({
      types,
      masterId,
    });
    return NextResponse.json({ submasters: groupSubMasterOptions(options) });
  } catch (error) {
    console.error("Failed to list submasters", error);
    return NextResponse.json(
      { error: "Unable to load submaster options" },
      { status: 500 }
    );
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

    const payload = subMasterPayloadSchema.parse(await request.json());

    await connectDB();
    const parent = await MasterOptionModel.findById(payload.masterId).lean();
    if (!parent) {
      return NextResponse.json({ error: "Parent master not found" }, { status: 404 });
    }

    const existing = await SubMasterOptionModel.findOne({
      masterId: payload.masterId,
      name: payload.name,
    }).lean();

    if (existing) {
      return NextResponse.json(
        { error: `${parent.name} already has this submaster` },
        { status: 409 }
      );
    }

    await SubMasterOptionModel.create({
      masterId: payload.masterId,
      masterType: parent.type,
      name: payload.name,
      description: payload.description ?? "",
      sortOrder: payload.sortOrder ?? 0,
    });

    return NextResponse.json({ message: "Submaster created" }, { status: 201 });
  } catch (error) {
    console.error("Create submaster failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Unable to create submaster option" },
      { status: 500 }
    );
  }
}
