# PRD — Delight.ai Asset Studio

> Sendbird 마케팅팀 사내 에셋 제작 툴 · v1.0.0 · 최종 정리 2026-06-07

---

## 1. 한 줄 요약

마케터가 **디자이너 없이** 제품 데모 이미지(채팅 UI 목업·인포그래픽)를 직접 만들어 PNG로 내보내는 사내 웹툴.

## 2. 배경 & 문제

- 데모/마케팅용 이미지(채팅 UI 목업, 데이터 인포그래픽)는 매번 디자이너 리소스가 필요 → 병목.
- 마케터가 **템플릿 선택 → 내용 입력 → 배경 선택 → 다운로드** 흐름으로 직접 만들 수 있으면 해결.
- 핵심 가치: **빠르고 쉽게**. 불필요한 단계·설정은 최소화한다.

## 3. 사용자

- **주 사용자**: 마케터 (사내 약 5~10명)
- 권한 분리 없음 — 로그인한 사용자는 모두 동일 권한
- 디자인/코드 지식 불필요

## 4. 핵심 기능 (MVP)

### 4.1 채팅 UI 목업 생성
- 시나리오 프리셋 선택 → 메시지 버블 편집 → 배경/레이아웃 선택 → PNG export
- **버블 6종**: text · actions(버튼) · products(상품카드) · checklist · status(상태 pill) · voice(보이스 카드)
- 레이아웃: Split / Center, 사이즈: Desktop / Mobile
- 상품 이미지는 Pexels에서 자동 검색·교체

### 4.2 인포그래픽 생성
- 포맷: Product feature / Blog·Perspective
- 프리셋 + 블록 편집 (stat · kpi-group · bar-group · step · node-list)
- 배경/액센트 컬러, 타이틀/푸트노트
- PNG export (@2x)

### 4.3 Create with AI (AI 보조 생성)
- **챗**: 프롬프트 입력 → AI가 6종 버블을 조합해 시나리오 자동 생성
- **인포그래픽**: 기사 붙여넣기 → AI가 데이터에 맞는 인포그래픽 추천(Analyze)
- **안전장치**: 모델 응답을 스키마 검증기로 통과(깨진/형식 안 맞는 결과 자동 폐기)
- **Mock 모드**: API 키 없이도 캔드 데이터로 동작 (방화벽/오프라인 대응)

### 4.4 공통
- PNG 다운로드 (@2x, Desktop/Mobile)
- 시나리오·배경 라이브러리
- 작업 에셋 저장/불러오기

## 5. AI 기능 상세 & 비용

| 항목 | 내용 |
|---|---|
| 모델 | Claude 3.5 Haiku (`claude-3-5-haiku`) — 서버사이드 호출 |
| 활성화 조건 | `ANTHROPIC_API_KEY` 발급 후 환경변수에 주입하면 끝 (코드 변경 불필요) |
| Mock 모드 | 키 미설정 시 자동 — 무료, 항상 동작 |
| 검증 | `validate-scenario`(챗) / `validate-suggestions`(인포그래픽) |

**예상 월 비용** (단가는 학습 시점 추정 — 콘솔에서 현재가 확인 필요. 1인당 월 챗 30회+인포그래픽 20회 가정):

| 인원 | Haiku(현재) | Sonnet(품질↑ 전환 시) |
|---|---|---|
| 5명 | 약 $1.0 (₩1,300) | 약 $3.6 (₩4,900) |
| 10명 | 약 $1.9 (₩2,600) | 약 $7.2 (₩9,800) |

→ 사내 규모(5~10명)에선 **비용 부담 사실상 없음** (월 1만 원 안쪽). 콘솔 spend limit으로 상한 통제 가능.

## 6. 기술 스택

- **Frontend**: Next.js 16 (App Router) · React 19 · TypeScript
- **UI**: Tailwind v4 · shadcn · @base-ui/react · lucide-react
- **상태**: Zustand (persist → localStorage 캐싱)
- **Export**: html-to-image (PNG)
- **외부 API**: Pexels(이미지 검색) · Anthropic(AI 생성) — 모두 mock 모드 지원

### 아키텍처 원칙
1. 비즈니스 로직은 `/lib`, UI 로직은 `/components`로 분리
2. API route는 얇게 — 실제 로직은 `/lib`
3. 새 템플릿은 template-registry에 **등록만** 하면 추가
4. 모든 외부 API 호출은 mock 모드 지원 (방화벽 환경 필수)

## 7. 데이터 · 인증 현황

| 영역 | 현재 | 향후 |
|---|---|---|
| 배경 이미지 | `/public/background` (파일시스템) | Cloudflare R2 |
| 에셋 저장 | localStorage (Zustand persist) | DB(Supabase) |
| 인증 | SITE_PASSWORD 게이트 (사이트 비밀번호) | Clerk(사용자별) |

## 8. 비범위 (Non-goals, 현재 단계)

- 사용자별 권한/역할 분리 ❌
- 사용자별 자산 관리·공유 ❌ (localStorage 로컬 저장만)
- 실시간 협업 ❌
- AI 생성 결과의 100% 정확도 보장 ❌ (검증기로 형식 안전성만 보장)

## 9. 마이그레이션 로드맵

- **Phase 1**: 배경 이미지 R2 이전 + Vercel Password Protection
- **Phase 2**: Supabase 도입 — 에셋/배경 메타데이터 DB 저장
- **Phase 3**: Clerk 인증 — 사용자별 자산 관리

## 10. 리스크 · 오픈 이슈

- **AI 라이브 경로 미검증**: 현재까지 동작 검증은 mock 모드로만 완료. 실제 키 연결 후 모델이 스키마(특히 챗 6종 버블, voice 단독 규칙)를 잘 지키는지 1회 실측 필요.
- **IT 방화벽**: AI 호출은 서버사이드라 Vercel 배포 시 사내망 영향 없음. 단, 사내망 로컬 dev에선 `api.anthropic.com` 아웃바운드 허용 필요.
- **데이터 영속성**: 에셋이 localStorage라 브라우저/기기 변경 시 유실 → Phase 2 DB 이전으로 해소.
- **인증 강도**: 현재 단일 비밀번호 게이트 → 배포 전 Phase 1/3로 보강 권장.
