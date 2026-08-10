/**
 * POST /api/auth/clear-cookie
 * Clears the HTTP-only accessToken cookie on logout.
 */

import { NextResponse } from "next/server";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,   // immediately expire
    path:     "/",
  });

  return response;
}
