# Studio Design Rules

에디터 UI 자체(오른쪽 패널, 상단바, 사이드바 등)의 디자인 규칙.
Studio가 **만들어내는** 목업 디자인 규칙은 `ASSET_DESIGN.md` 참조.

---

## Color Tokens

앱 UI 토큰의 source of truth는 `lib/tokens/app.ts`다. `app/layout.tsx`가
토큰을 CSS 변수로 주입하고, `app/globals.css`는 Tailwind
`bg-studio-*` / `text-studio-*` 유틸리티가 그 변수를 보도록 연결한다.
컴포넌트는 hex 값을 직접 쓰지 않는다.

| Token | Hex | 용도 |
|---|---|---|
| `studio-bg` | `#252525` | 캔버스 영역 배경 |
| `studio-sidebar` | `#1A1A1A` | 패널, 팝업, 드롭다운 배경 |
| `studio-border` | `#333333` | 구분선, 입력 테두리 |
| `studio-text` | `#FFFFFF` | 기본 텍스트 |
| `studio-muted` | `#888888` | 보조 텍스트, 아이콘 |
| `studio-hover` | `#2E2E2E` | hover 상태 배경 |
| `studio-accent` | `#F2FF66` | 강조 (CTA 버튼 등) |
| `studio-accent-fg` | `#000000` | accent 위 텍스트 |

> **특수 컬러**: crop selector 전용 lime은 `studio-crop-selector`로 분리한다.

---

## Typography

- 기본 UI 텍스트: `text-xs` (12px)
- 섹션 헤더: `text-[10px] font-semibold uppercase tracking-wider text-studio-muted`
- 패널 라벨: `text-xs font-medium`
- 버튼 텍스트: `text-xs` ~ `text-sm font-semibold`
- 폰트 패밀리: 시스템 기본값 (별도 커스텀 없음)

---

## Layout

### 전체 구조

```
┌─────────────┬──────────────────────┬───────────────┐
│  Top bar    (h: auto, border-b)                    │
├─────────────┼──────────────────────┼───────────────┤
│  Left       │  Canvas (flex-1)     │  Right Panel  │
│  Sidebar    │  bg-studio-bg        │  bg-studio-   │
│  (홈 화면)  │                      │  sidebar      │
└─────────────┴──────────────────────┴───────────────┘
```

### Right Panel

- 기본 너비: `320px` (w-80)
- 최소 너비: `240px` / 최대 너비: `520px`
- 리사이즈 핸들: 패널 왼쪽 엣지 1px, 기본 투명 → hover 시 `#F2FF66`
- 내부 패딩: `p-5` (20px)
- 스크롤: `overflow-y-auto`
- 에디터 첫 진입 시 store hydrate 전에도 template 기본 content로 패널 컨트롤을 렌더한다.

### Section 컴포넌트

패널 내 각 섹션의 구조:
```
[Section Title]    [optional action button]
────────────────────────────────────────────
[content]
```
- 타이틀: `text-[10px] font-semibold uppercase tracking-wider text-studio-muted`
- 섹션 간격: `mb-6` (하단 마진)
- 구분선: `border-b border-studio-border mb-4`
- Infographic의 Block 선택 섹션은 현재 블록 1개만 크게 보여주지 않고, 현재 선택 포함 최소 3개 블록 타입을 compact list로 노출한다.

---

## Components

### 입력 필드 (Input)

```
bg-studio-sidebar border-studio-border text-studio-text
placeholder:text-studio-muted
h-7 (패널 내부) / h-8 (상단 섹션)
```

### 버튼

| 종류 | 스타일 |
|---|---|
| Primary (Export) | `bg-studio-accent text-studio-accent-fg font-semibold rounded-xl px-6 py-2.5` |
| Secondary (Save) | `border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover rounded-xl` |
| Ghost (아이콘) | `text-studio-muted hover:text-studio-text hover:bg-studio-hover rounded-md` |
| Destructive hover | `hover:text-red-400 hover:bg-studio-hover` |
| Disabled | `disabled:opacity-40 disabled:cursor-not-allowed` |

### ToggleGroup (Layout / Export Size)

```
p-0.5 bg-studio-hover rounded-lg
활성: bg-studio-sidebar text-studio-text
비활성: text-studio-muted hover:text-studio-text
```

### 드롭다운 (Menu / Select)

모든 드롭다운은 동일한 다크 테마 사용:
```
Popup:  bg-studio-sidebar border border-studio-border shadow-lg rounded-lg py-1
Item:   px-3 py-1.5 text-xs text-studio-text hover:bg-studio-hover cursor-default
```

### Settings / 작업 보존

- 상단바 Settings 아이콘 안에만 수동 보존 기능을 둔다.
- 메인 편집 패널, source 입력, screenshot 입력, export 버튼 주변에는 복원/백업 기능을 노출하지 않는다.
- 메뉴 항목은 `Restore previous version`, `Save backup file`, `Load backup`을 사용한다.
- 사용자에게 보이는 문구에는 내부 파일 포맷명을 쓰지 않고 항상 `backup file`로 표현한다.
- 복원 화면은 스냅샷 시간 목록과 `Restore` 액션만 제공한다.
- Vercel Blob 클라우드 스냅샷은 복원 화면 안에서만 조용히 병합한다. 메인 작업 화면에는 cloud/backup 상태를 노출하지 않는다.

### Background Library

- Chat UI 배경 모달 탭: All / General / Brand themes / Industry / Everyday.
- Brand themes 배경은 특정 제품 전용 여부를 썸네일 우상단 배지로 표시한다.
- Everyday 탭은 일상 속 인물·디바이스 사진 배경을 담는다.

### Product Visual Source Modes

- Source segmented control은 Concept UI / Screenshot 두 가지를 제공한다.
- Product Feature 포맷에서는 Screenshot을 비활성화하고 Concept UI를 기본 source로 사용한다.
- Rebuild from reference는 품질 개선 전까지 archived 상태로 UI에 노출하지 않는다. 코드 경로는 나중에 다시 켤 수 있게 보관한다.

### Toast

```
fixed bottom-6 left-1/2 -translate-x-1/2
bg-studio-sidebar border border-studio-border shadow-xl rounded-xl
text-sm text-studio-text px-4 py-2.5
지속 시간: 3000ms
```

### Coachmark

- 첫 진입 안내는 공통 `CoachmarkBubble`을 사용한다.
- Chat UI는 Scenario 섹션, Infographic은 source 입력에 고정한다.
- 사용자가 해당 입력/선택/생성 행동을 시작하면 즉시 dismiss한다.
- Product Visual은 다단계 Concept UI 흐름이므로 coachmark 대신 우측 step 안내와 왼쪽 샘플 대시보드 preview를 사용한다.

---

## Interaction Patterns

- **hover 전환**: `transition-colors` (기본)
- **opacity 전환**: `transition-opacity` (버튼 hover, export 드롭다운 등)
- **포커스 링**: `focus:ring-1 focus:ring-studio-accent`
- **오버플로우 경고**: 빨간 텍스트 `text-red-400 text-xs`
- **드롭다운 방향**: Add message → `side="top"` (위로 열림), Export → `side="top" align="end"`
- **입력 상한**: Infographic 블록은 Add 버튼을 상한 도달 시 disabled 처리하고, title 속성으로 간단한 제한 이유를 제공한다. 상한값은 `lib/infographic-block-limits.ts`만 참조한다.

---

## Icons

lucide-react 사용. 패널 내 아이콘 크기:
- 인라인 작은 아이콘: `size={11}` ~ `size={13}`
- 버튼 아이콘: `size={14}` ~ `size={15}`
- 섹션 헤더 아이콘: `size={12}` ~ `size={13}`
