import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import type { Role, UserDocument } from "@/models/user";
import { UserModel } from "@/models/user";

const TOKEN_NAME = "auth_token";
const JWT_SECRET = process.env.JWT_SECRET;

let secret: Uint8Array | null = null;

function getSecret() {
  if (!secret) {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not set. Add it to your environment variables.");
    }
    secret = new TextEncoder().encode(JWT_SECRET);
  }

  return secret;
}

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

export async function createToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${authCookieOptions.maxAge}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify<TokenPayload>(token, getSecret());
  return payload;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(TOKEN_NAME, token, authCookieOptions);
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete(TOKEN_NAME);
}

export async function getTokenFromCookies() {
  const store = await cookies();
  return store.get(TOKEN_NAME)?.value || null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);
    await connectDB();
    const user = await UserModel.findById(payload.userId).lean<UserDocument>();
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone ?? "",
      role: user.role,
    };
  } catch (error) {
    console.error("getCurrentUser failed", error);
    return null;
  }
}
