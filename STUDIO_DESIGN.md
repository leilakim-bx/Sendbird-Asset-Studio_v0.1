# Studio Design Rules

에디터 UI 자체(오른쪽 패널, 상단바, 사이드바 등)의 디자인 규칙.
Studio가 **만들어내는** 목업 디자인 규칙은 `ASSET_DESIGN.md` 참조.

---

## Color Tokens

CSS 변수로 정의(`app/globals.css`), Tailwind `bg-studio-*` / `text-studio-*` 유틸리티로 사용.

| Token | Hex | 용도 |
|---|---|---|
| `studio-bg` | `#252525` | 캔버스 영역 배경 |
| `studio-sidebar` | `#1A1A1A` | 패널, 팝업, 드롭다운 배경 |
| `studio-border` | `#333333` | 구분선, 입력 테두리 |
| `studio-text` | `#FFFFFF` | 기본 텍스트 |
| `studio-muted` | `#888888` | 보조 텍스트, 아이콘 |
| `studio-hover` | `#2E2E2E` | hover 상태 배경 |
| `studio-accent` | `#D4FF4D` | 강조 (CTA 버튼 등) |
| `studio-accent-fg` | `#000000` | accent 위 텍스트 |

> **특수 컬러**: `#F2FF66` — resize handle hover, success pill 배경. `studio-accent`와 구분해서 사용.

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

- 기본 너비: `288px` (w-72)
- 최소 너비: `240px` / 최대 너비: `520px`
- 리사이즈 핸들: 패널 왼쪽 엣지 1px, 기본 투명 → hover 시 `#F2FF66`
- 내부 패딩: `p-5` (20px)
- 스크롤: `overflow-y-auto`

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

### Toast

```
fixed bottom-6 left-1/2 -translate-x-1/2
bg-studio-sidebar border border-studio-border shadow-xl rounded-xl
text-sm text-studio-text px-4 py-2.5
지속 시간: 3000ms
```

---

## Interaction Patterns

- **hover 전환**: `transition-colors` (기본)
- **opacity 전환**: `transition-opacity` (버튼 hover, export 드롭다운 등)
- **포커스 링**: `focus:ring-1 focus:ring-studio-accent`
- **오버플로우 경고**: 빨간 텍스트 `text-red-400 text-xs`
- **드롭다운 방향**: Add message → `side="top"` (위로 열림), Export → `side="top" align="end"`

---

## Icons

lucide-react 사용. 패널 내 아이콘 크기:
- 인라인 작은 아이콘: `size={11}` ~ `size={13}`
- 버튼 아이콘: `size={14}` ~ `size={15}`
- 섹션 헤더 아이콘: `size={12}` ~ `size={13}`
