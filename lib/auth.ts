// 사이트 비밀번호 게이트의 공용 상수 + 토큰 헬퍼.
// proxy.ts(인증 검증)와 app/api/auth/route.ts(로그인)에서 공유한다.
//
// 보안 모델: 단일 공용 비밀번호 게이트(권한 분리 없음).
// 쿠키에는 비밀번호 원문이 아니라 SHA-256 해시를 저장한다.

export const COOKIE_NAME    = "studio-auth";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일 (초)

/**
 * 문자열의 SHA-256 hex 다이제스트.
 * Web Crypto 사용 → Node.js / Edge 런타임 모두 호환.
 */
export async function hashToken(secret: string): Promise<string> {
  const data   = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
