# Delight.ai Asset Studio — 프로젝트 컨텍스트 (Infographic 설계용)

> 이 문서는 내부 설계 맥락 참고용입니다.
> 보안 정책상 프로젝트 맥락을 외부 LLM에 붙여넣지 않는다.

---

## 0. 참고 목적
Infographic 템플릿의 블록 모델, 레이아웃, 데이터 모델, export 제약을 빠르게 파악하기 위한 내부 요약이다.

---

## 1. 제품 개요
- **이름**: Sendbird / Delight.ai Asset Studio (사내 마케팅 도구)
- **목적**: 마케팅 팀이 **디자이너 없이** 제품 데모 이미지(채팅 UI 목업 등)를 만들어 다운로드.
- **주 사용자**: 마케터. 워크플로 = **템플릿 선택 → 텍스트 입력 → 배경 선택 → PNG 다운로드.** 권한 구분 없음.
- 코드/디자인은 노코드가 아니라, **템플릿이 미리 짜여 있고 사용자는 콘텐츠만 채우는** 방식.

## 2. 기술 스택
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4 (CSS 기반) + shadcn + @base-ui/react
- Zustand (localStorage persist)
- **html-to-image** 로 DOM → PNG export (@2x)
- 외부 이미지: Pexels (Pexels-only same-origin proxy 경유)
- 시나리오/추천 생성: 외부 LLM 없이 로컬 프리셋·규칙 기반

## 3. 핵심 아키텍처

### 3-1. 템플릿 시스템
- `lib/template-registry.ts` 에 템플릿을 등록. 현재 등록된 건 **`feature-mockup` (Chat conversation) 하나뿐**.
- 각 템플릿 정의:
  ```ts
  type Template = {
    id, name, description,
    layouts: ("center" | "split")[],
    exportSizes: ExportSize[],
    defaultLayout,
    defaultContent: { appName, backgroundId, messages },
  }
  ```
- 원칙: **새 템플릿은 registry에 등록만 하면 추가되도록** 설계 지향.
- "Infographic", "Product UI" 는 홈 화면에 카드로 보이지만 **`Soon` placeholder(아직 코드 없음)**.

### 3-2. 콘텐츠 = "블록"의 배열 (discriminated union)
Chat 템플릿의 한 메시지는 `role`(user|bot) + `block`. 블록 6종:
| type | 설명 |
|---|---|
| `text` | 말풍선 텍스트. (bot 한정 옵션 `verifications: string[]` → 버블 안 "AI agent activity log" 풋터) |
| `actions` | 액션 버튼들 `buttons: string[]` |
| `products` | 상품 카드 `items[]` (img, name, sub(가격), cta) — 1개면 가로형, 2개면 2열 그리드 |
| `checklist` | 체크리스트 `items[]` (label, status: done/in-progress/pending) |
| `status` | 상태 pill (label, variant: success/warning) |
| `voice` | 보이스 카드 (transcript, caption, eyebrow, style) |
- **Infographic도 같은 "블록" 사고방식**으로 설계하는 걸 권장(예: stat / kpi / bar / pie / timeline / icon-list 같은 블록).

### 3-3. 렌더링·Export 모델
- 화면의 미리보기는 **고정 픽셀 캔버스를 transform:scale 로 축소**해 보여줌.
- Export 시엔 **화면 밖(off-screen)에 desktop·mobile 캔버스를 항상 풀사이즈로 렌더**해 두고 html-to-image로 그대로 캡처.
- **Export 사이즈 (중요):**
  - **Desktop: 866 × 660 (고정)**
  - **Mobile: 343 × 가변높이** (콘텐츠만큼 세로로 늘어남, 최소 385)
  - PNG, **@2x** (desktop 실제 1732×1320px 등)
- Export 메뉴: Desktop / Mobile (현재 "Both"는 Soon).
- **html-to-image 제약(설계 시 유의):** `backdrop-filter`(유리효과)는 라운드 모서리로 클리핑이 안 돼 사각형으로 새므로, 둥근+블러 요소는 **border-radius+overflow:hidden 부모로 감싸 클리핑**해야 함. 폰트/이미지는 export 전에 인라인 처리함. 너무 특이한 CSS는 래스터화에서 깨질 수 있음 → **단순·견고한 레이아웃 선호**.

### 3-4. 레이아웃 옵션
- `center`: 콘텐츠를 배경 위 중앙. (자연물/일반 배경에 적합)
- `split`: 콘텐츠를 한쪽으로 몰아 사람 얼굴을 피함. (인물 사진 배경에 적합)

## 4. 디자인 언어 (기존 Chat 템플릿 = 참고 기준)
- 배경 이미지(라이프스타일/자연/브랜드/산업 사진) 위에 **글래스모피즘 카드**(반투명 흰색 + blur + 라운드 + 부드러운 그림자)를 얹는 비주얼.
- 카드 안 텍스트는 검정 계열(#111), 보조 텍스트 회색(#8C867E), 강조 라임색 포인트.
- 배경 라이브러리는 탭으로 분류: General(자연물) / Brand themes / Industry(Retail·B2B·Healthcare·On-demand·Financial services·Travel).

### 에디터 UI 테마 토큰 (다크 툴 UI — 이건 "에디터 껍데기" 색이고, export 결과물 색이 아님)
```
--studio-bg        #252525   (캔버스 배경)
--studio-sidebar   #1A1A1A   (사이드바/패널)
--studio-border    #333333
--studio-text      #FFFFFF
--studio-muted     #888888
--studio-hover     #2E2E2E
--studio-accent    #D4FF4D   (라임, 주요 버튼)
--studio-accent-fg #000000
```

### 우측 사이드바 섹션 (에디터 UX) — 현재 순서
Background → Layout → Scenario → Messages → User Profile → App Name
(Background·Layout은 첫 진입 시 접힘, Scenario·Messages는 펼침)

## 5. Infographic 템플릿이 풀어야 할 숙제 (설계 대상)
- 마케터가 **숫자/짧은 텍스트만 입력**하면 깔끔한 인포그래픽 이미지가 나와야 함.
- 위 export 사이즈(866×660 / 343×가변)와 배경+카드 비주얼 언어, 블록 모델에 **자연스럽게 맞물려야** 함.
- 고민할 것 예시: 어떤 블록 타입(통계 수치, 비교 바, 단계/타임라인, 아이콘 리스트, 인용구 등)? 데스크탑(가로 와이드)과 모바일(세로 긴)에서 같은 데이터를 어떻게 다르게 배치? 차트는 어디까지 지원? 색/타이포 시스템은?

## 6. 코딩/운영 컨벤션 (참고)
- 파일명 kebab-case, 컴포넌트 PascalCase, `any` 금지(`unknown`), 비즈니스 로직은 `/lib`·UI는 `/components` 분리.
- 외부 네트워크 호출은 Pexels 검색/이미지 CDN으로 제한(방화벽 환경 고려).
- 현재 데이터: 배경=정적 파일, 에셋=localStorage (추후 승인된 내부 저장소/Supabase/Clerk 검토). 인증 없음(베타 전 추가 예정).

---

### 사용법
1. 내부 설계 리뷰나 구현 전 맥락 확인에 사용한다.
2. 실제 작업 기준은 `PRD.md`, `DEVELOPMENT_DESIGN.md`, `STUDIO_DESIGN.md`, `ASSET_DESIGN.md`를 우선한다.
