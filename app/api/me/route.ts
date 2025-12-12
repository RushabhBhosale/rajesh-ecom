import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/user";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(8).max(20).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
    },
  });
}

export async function PUT(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = updateSchema.parse(await request.json());
    await connectDB();
    const user = await UserModel.findById(current.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (payload.name) {
      user.name = payload.name;
    }
    if (payload.phone !== undefined) {
      user.phone = payload.phone;
    }
    await user.save();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}
