import { NextResponse } from "next/server";

import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import type { UserDocument } from "@/models/user";
import { UserModel } from "@/models/user";

export async function GET() {
  try {
    const token = await getTokenFromCookies();
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyToken(token);

    await connectDB();

    const user = await UserModel.findById(payload.userId).lean<UserDocument>();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Fetch current user failed", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
