import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { COOKIE_NAME, hashToken } from "@/lib/auth";

/**
 * 사이트 비밀번호 게이트.
 * (Next 16: 구 `middleware` 컨벤션이 `proxy`로 rename됨)
 *
 * SITE_PASSWORD 미설정 시 인증을 우회한다 (로컬/CI 편의).
 * 쿠키 토큰이 비밀번호 해시와 일치하지 않으면 /login으로 리다이렉트.
 */
export async function proxy(request: NextRequest) {
  const sitePassword = env.sitePassword;

  // 비밀번호 미설정 → 게이트 비활성화
  if (!sitePassword) return NextResponse.next();

  const token    = request.cookies.get(COOKIE_NAME)?.value;
  const expected = await hashToken(sitePassword);

  if (token === expected) return NextResponse.next();

  // 미인증 → /login으로, 원래 목적지를 from 파라미터로 보존
  const loginUrl          = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/") loginUrl.searchParams.set("from", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // 다음을 제외한 모든 경로 보호:
    //  - login (게이트 페이지), api/auth (로그인 엔드포인트)
    //  - _next/static, _next/image (Next 내부)
    //  - 점(.)이 포함된 경로 = 정적 파일 (.svg / .png / .ico / /preview/* / /background/*)
    "/((?!login|api/auth|_next/static|_next/image|.*\\..*).*)",
  ],
};
