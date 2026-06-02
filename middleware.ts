import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "studio-auth";

export function middleware(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  // SITE_PASSWORD 미설정 시 → 오픈 (로컬 개발 편의)
  if (!sitePassword) return NextResponse.next();

  // 인증 쿠키가 올바르면 통과
  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === sitePassword) return NextResponse.next();

  // 로그인 페이지로 리다이렉트
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  // 정적 파일, 이미지, 로그인·인증 라우트 제외
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|login|api/auth|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)",
  ],
};
