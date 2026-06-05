import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { COOKIE_NAME, COOKIE_MAX_AGE, hashToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body         = (await request.json().catch(() => ({}))) as { password?: string };
  const sitePassword = env.sitePassword;

  if (!sitePassword || body.password !== sitePassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  // 쿠키 값 = 비밀번호의 SHA-256 해시 (원문 저장 금지)
  response.cookies.set(COOKIE_NAME, await hashToken(sitePassword), {
    httpOnly: true,
    secure:   env.isProd,
    sameSite: "lax",
    maxAge:   COOKIE_MAX_AGE,
    path:     "/",
  });
  return response;
}
