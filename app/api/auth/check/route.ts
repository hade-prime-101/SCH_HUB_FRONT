import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const cookieName = process.env.AUTH_COOKIE_NAME || "accessToken";
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    // In dev (no real backend), treat missing cookie as unauthenticated
    // so the splash redirects to /login rather than staying stuck
    return NextResponse.json(
      { authenticated: false, message: "No auth cookie found" },
      { status: 401 }
    );
  }

  const baseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { authenticated: false, message: "API_URL not configured" },
      { status: 503 },
    );
  }
  const endpoint = process.env.AUTH_CHECK_ENDPOINT || "/auth/me";

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        Cookie: `${cookieName}=${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, message: "Authentication check failed" },
      { status: 401 }
    );
  }
}
