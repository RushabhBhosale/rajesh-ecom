import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const TOKEN_NAME = "auth_token";

let cachedSecret: Uint8Array | null = null;

function getSecret() {
  if (!cachedSecret) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not set. Add it to your environment variables.");
    }
    cachedSecret = new TextEncoder().encode(secret);
  }

  return cachedSecret;
}

type Role = "user" | "admin" | "superadmin";

interface GuardRoute {
  prefix: string;
  roles: Role[];
}

const protectedRoutes: GuardRoute[] = [
  { prefix: "/dashboard", roles: ["user", "admin", "superadmin"] },
  { prefix: "/admin", roles: ["admin", "superadmin"] },
  { prefix: "/superadmin", roles: ["superadmin"] },
];

const authRoutes = ["/login", "/register"];

async function verify(token: string) {
  const { payload } = await jwtVerify<{ role?: Role }>(token, getSecret());
  return payload;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_NAME)?.value ?? null;

  const protectedRoute = protectedRoutes.find((route) =>
    pathname.startsWith(route.prefix)
  );

  if (protectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const payload = await verify(token);
      if (!payload.role || !protectedRoute.roles.includes(payload.role)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      console.error("Invalid token", error);
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(TOKEN_NAME);
      return response;
    }
  }

  if (authRoutes.includes(pathname)) {
    if (!token) {
      return NextResponse.next();
    }

    try {
      await verify(token);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/superadmin/:path*",
    "/login",
    "/register",
  ],
};
