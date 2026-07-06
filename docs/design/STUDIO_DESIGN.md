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

### Left Sidebar

- 홈/최근 에셋 네비게이션은 상단에 둔다.
- 새 작업 시작 영역은 `Create asset` -> `Create with Codex` 순서로 둔다.
  - `Create asset`은 기존 수동 템플릿 선택 flow를 그대로 연다.
  - `Create with Codex`는 페이지 copy를 붙여넣고 textarea 우하단의 compact `Get image suggestions`를 눌러 필요한 이미지 세트를 먼저 정리한 뒤 Codex planning prompt를 복사하는 홈 전용 planning entry이며, 보조 CTA로 그라데이션 테두리를 사용하고 hover 시 같은 gradient fill로 전환한다. `Get image suggestions` 왼쪽에는 icon-only `Optimize for suggestions` 버튼을 두고, 클릭 시 원문을 삭제하지 않고 textarea 맨 앞에 Feature/Core message/Audience/Visual priority/Key moments/Avoid brief를 붙여 router와 Codex가 같은 입력을 더 안정적으로 읽게 한다.
  - `Create with Codex` 모달의 추천 결과는 기본 3개 asset set으로 고정하고 2단 그리드로 보여준다. Studio 안에서는 교체 후보를 노출하지 않고, 대체 가능한 후보는 복사되는 Codex prompt 안에만 포함해 Codex에서 말로 조정하게 한다. 결과 카드는 템플릿별 preview 썸네일, 짧은 고정 제목, 템플릿 pill, 사용 위치만 보여주며 brief는 화면에 노출하지 않는다. Infographic 추천 썸네일은 `public/preview/suggestions_thumbnail_imfographic.png` 대표 이미지를 사용한다.
  - Codex에서 전체 asset set을 렌더하면 10-20분 걸릴 수 있으므로, planning prompt 복사 버튼 근처에 짧은 소요 시간 안내를 노출한다.
- 저장 에셋 찾기는 `Create with Codex` 아래의 `Asset finder` 단일 버튼으로 노출한다. 버튼은 `/open`을 열고, 세부 카테고리 전환은 열린 화면의 Chat UI / Infographic / Product Visual 탭에서 처리한다.
- `Create asset`, `Create with Codex`, `Asset finder`는 같은 compact corner radius(`--app-sidebar-action-radius`, `controlLg`)를 사용해 하나의 action group처럼 보이게 한다.
- Codex 관련 액션과 `Guides`는 사이드바 최하단에 아이콘+텍스트 유틸리티 링크로 둔다. 박스형 버튼이나 설명 문구는 노출하지 않고, 필요한 설명은 hover tooltip으로 제공한다. `Download Codex Skill`은 정적 zip 파일을 직접 내려받는 버튼으로 동작하며 준비/완료/실패 상태를 inline으로 표시한다.

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
- Infographic의 Block 선택 섹션은 quick list를 선택 상태에 따라 바꾸지 않고 `Orbit diagram`, `Hub map`, `Comparison cards` 3개를 고정 노출한다. 나머지 블록 타입은 `Browse all blocks` 모달에서 선택한다. 단, 모달에서 선택된 library-only 블록은 현재 선택 상태를 명확히 하기 위해 이 3개 위에 임시로 노출한다.

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
- Concept UI source의 기본 입력 섹션은 `Create from brief`이며, `Add guidance`로 짧은 feature/user/surface/proof/avoid 힌트를 붙일 수 있다. Brief composer는 Chat UI/Infographic과 같은 라임색 arrow submit 버튼을 우측 하단에 두되, `Card`와 `Details panel` block 선택지는 첫 진입부터 바로 노출한다.
- Product Visual 생성 액션은 자유로운 archetype 선택 대신 2개의 compact block 카드(`Card`, `Details panel`)를 보여준다. 각 선택지는 Infographic block selector처럼 왼쪽에 실제 기본 렌더 기반 thumbnail image, 오른쪽에 title/description을 가진 행형 카드로 보여 결과 형태를 선택 전에 파악할 수 있게 한다. 선택된 카드는 2px lime outline으로만 표시하고 추천 badge는 쓰지 않는다.
- Product Visual `Card` 편집 UI는 reviewer를 토글 스위치가 아니라 `Show reviewer` checkbox로 제어한다. 체크를 끄면 reviewer label/avatar/name row만 숨기고 reviewer 값은 유지해 다시 켰을 때 복원한다.
- Product Visual `Card`의 source row는 source label/match와 함께 제한된 5개 icon preset(Document, Knowledge, Customer, Data, Conversation)만 선택하게 한다. 자유 아이콘 업로드나 임의 lucide 이름 입력은 제공하지 않는다.
- Product Visual `Details panel`은 body variant 선택을 노출하지 않는다. 편집 UI는 Title, `Show information` checkbox, Information 값 4개, Activity tag/text 3줄처럼 최종 이미지에 실제로 보이는 slot만 남겨 결과를 안정적으로 유지한다. `Show information`을 끄면 Information 섹션과 Activity heading을 숨겨 timeline-only detail panel로 즉시 렌더한다.
- compact block 생성 후에는 `Edit block copy` 섹션을 노출해 Title, main text, evidence/source, CTA처럼 마케터가 실제로 바꿔야 하는 slot만 수정하게 한다. Layout, spacing, block type은 고정해 결과 품질을 유지하며, copy edit은 별도 update 버튼 없이 프리뷰에 자동 반영한다. 이 편집 영역은 Chat UI block editor와 같은 `bg-studio-hover` card surface와 `bg-studio-sidebar` input styling을 사용해 오른쪽 패널 안에서 일관된 편집 경험을 유지한다.
- Concept UI source에서는 frame 선택 섹션을 노출하지 않는다. 제한된 compact block은 항상 primary panel만 floating capture로 렌더한다.
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
- Chat UI는 Scenario 섹션, Infographic은 source 입력, Product Visual은 Concept UI 설명 입력에 고정한다.
- 사용자가 해당 입력/선택/생성 행동을 시작하면 즉시 dismiss한다.
- Product Visual은 step 안내와 왼쪽 샘플 대시보드 preview를 유지하되, 첫 진입에는 Concept UI 설명 입력을 가리키는 1회성 coachmark를 함께 사용한다.

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
