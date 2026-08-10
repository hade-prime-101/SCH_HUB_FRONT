/**
 * POST /api/auth/set-cookie
 * Sets an HTTP-only accessToken cookie after a successful login/register.
 * Called client-side after receiving tokens from the backend.
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME   = process.env.AUTH_COOKIE_NAME   || "accessToken";
const COOKIE_SECURE = process.env.NODE_ENV === "production";
// Access token lifetime in seconds — default 15 minutes, override via env
const MAX_AGE       = parseInt(process.env.AUTH_COOKIE_MAX_AGE || "900", 10);

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json(
        { message: "accessToken is required" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure:   COOKIE_SECURE,
      sameSite: "lax",
      maxAge:   MAX_AGE,
      path:     "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Failed to set auth cookie" },
      { status: 500 },
    );
  }
}
