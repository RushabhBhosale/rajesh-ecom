import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser, hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import type { Role } from "@/models/user";
import { UserModel, roles } from "@/models/user";

const payloadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(roles).optional(),
});

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = payloadSchema.parse(await request.json());

    const allowedRoles: Role[] = actor.role === "superadmin" ? [...roles] : ["user"];
    const desiredRole = (parsed.role ?? "user") as Role;

    if (!allowedRoles.includes(desiredRole)) {
      return NextResponse.json({ error: "You cannot assign that role" }, { status: 403 });
    }

    await connectDB();

    const existing = await UserModel.findOne({ email: parsed.email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(parsed.password);
    const user = await UserModel.create({
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      role: desiredRole,
    });

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
