import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME    = "studio-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export async function POST(request: NextRequest) {
  const body         = (await request.json()) as { password?: string };
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || body.password !== sitePassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, sitePassword, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   COOKIE_MAX_AGE,
    path:     "/",
  });
  return response;
}
