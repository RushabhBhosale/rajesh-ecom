import { NextResponse } from "next/server";
import { z } from "zod";

import { createToken, hashPassword, setAuthCookie } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import type { Role } from "@/models/user";
import { UserModel, roles } from "@/models/user";

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(8).max(20).optional(),
  role: z.enum(roles).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, phone } = registerSchema.parse(body);

    await connectDB();

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const userCount = await UserModel.countDocuments();
    let assignedRole: Role = "user";

    if (userCount === 0) {
      assignedRole = (role as Role | undefined) ?? "superadmin";
    } else if (role && role !== "user") {
      return NextResponse.json(
        { error: "Only existing admins can assign elevated roles" },
        { status: 403 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await UserModel.create({
      name,
      email,
      phone: phone ?? "",
      password: hashedPassword,
      role: assignedRole,
    });

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
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

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error("Register failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
