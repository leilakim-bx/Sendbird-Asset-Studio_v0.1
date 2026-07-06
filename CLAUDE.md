@AGENTS.md

# Sendbird Asset Studio

## 프로젝트 목적
센드버드 마케팅 팀이 디자이너 없이 제품 데모 이미지(채팅 UI 목업 등)를 
만들 수 있는 사내 도구.

## 사용자
- 마케터 (주 사용자): 템플릿 선택 → 텍스트 입력 → 배경 선택 → 다운로드
- 권한 분리 없음. 모든 로그인 사용자 동일 권한.

## 기술 스택
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4 + shadcn + @base-ui/react
- Zustand (persist로 localStorage 캐싱)
- html-to-image (PNG export)
- Pexels API (제품 이미지)
- 외부 LLM 호출 없음: 시나리오/추천은 로컬 프리셋·규칙 기반

## 아키텍처 원칙
1. 비즈니스 로직은 /lib에, UI 로직은 /components에 분리
2. API routes는 얇게, 실제 로직은 /lib에서
3. 새 템플릿 추가는 template-registry에 등록만 하면 되게
4. 외부 네트워크 호출은 Pexels 검색/이미지 CDN으로 제한

## 데이터 저장 (현재)
- 배경 이미지: /public/background
- 에셋: localStorage (Zustand persist) (⚠️ DB로 이전 예정)
- 인증: Vercel Password Protection (Enterprise) — production 보호. 로컬 dev는 게이트 없음. 자체 비번 게이트(proxy.ts/SITE_PASSWORD)는 제거됨.

## 마이그레이션 로드맵
Phase 1: Vercel Password Protection (✅ 완료)
Phase 2: Supabase 도입, 에셋/배경 메타데이터 저장
Phase 3: Clerk 인증, 사용자별 자산 관리

## 코딩 컨벤션
- 파일명: kebab-case
- 컴포넌트: PascalCase
- 타입은 /types 또는 컴포넌트 파일 상단에
- any 금지, unknown 사용
- 환경변수는 lib/env.ts에서 검증 후 export

## 작업 시 주의
- 신규 의존성 추가 전 반드시 확인 요청
- DB 스키마 변경 시 마이그레이션 파일 분리
- localStorage 데이터 구조 변경 시 마이그레이션 함수 작성
- IT 방화벽 환경 고려 (Pexels 외 외부 호출 없이 동작해야 함)
- 블록 타입 추가/삭제 시 tests/guards/block-conformance.test.ts 의 EXPECTED 목록도 갱신.
