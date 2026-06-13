# Asset Design Rules

Studio가 **만들어내는** 채팅 UI 목업(phone frame 안의 내용)의 디자인 규칙.
에디터 UI 자체의 규칙은 `STUDIO_DESIGN.md` 참조.

---

## Brand Tokens

에셋 렌더 토큰의 source of truth는 `lib/tokens/brand.ts`다. Chat 목업,
Infographic canvas/blocks, Product Visual canvas, Concept UI scene renderer는
색, 폰트, radius, spacing, shadow 값을 컴포넌트에 직접 쓰지 않고 brand
토큰에서 가져온다. Tool UI용 `lib/tokens/app.ts`는 에셋 렌더 경로에서
import하지 않는다.

## Infographic Render Safety

- Infographic block renderer는 `lib/infographic-block-limits.ts`의 항목/텍스트 상한을 방어적으로 적용한다.
- Product feature 포맷은 고정 866×660 export이므로 dense chart/list block은 안전 여백을 침범하지 않도록 item 수를 제한하거나 내부 spacing을 조밀하게 조정한다.
- Blog/Perspective 포맷은 가변 높이를 허용하지만, block library preview와 실제 export가 같은 구조를 유지해야 한다.

## Canvas (Export 기준)

| 뷰포트 | 크기 | 용도 |
|---|---|---|
| Desktop | `866 × 660 px` | 블로그, 웹 배너, PT 슬라이드 |
| Mobile | `344 × 385 px` (가변 높이) | SNS, 모바일 광고 |

배경: Pexels 사진 또는 커스텀 업로드 이미지, `object-fit: cover`
글래스모피즘 오버레이: `rgba(255,255,255,0.02)` (center) / 좌측 그라디언트 (split)

---

## Phone Frame

glassmorphism 카드 스타일.

```
background:     rgba(255,255,255,0.25)
backdropFilter: blur(20px)
border:         1px solid rgba(255,255,255,0.3)
boxShadow:      0 8px 32px rgba(0,0,0,0.08)
```

| | Desktop | Mobile |
|---|---|---|
| border-radius | `32px` | `26px` |
| 헤더 표시 | ✓ (app name + `···`) | ✗ |
| 최대 높이 | 캔버스 - vPad×2 | 제한 없음 (가변) |

### Scale 시스템

프레임 너비와 최대 높이에 따라 `scale` 계산. 모든 내부 수치에 곱함.

```ts
// Desktop: 너비/높이 양쪽 제약
scale = Math.min(1.08, frameWidth / 329, maxHeight / 500)

// Mobile: 너비만 제약
scale = Math.min(1.08, frameWidth / 329)
```

- 폰트 크기: `Math.min(1, scale)` 캡 (레이아웃은 scale, 텍스트는 최대 1.0)
- 수치 계산: `Math.round(n * scale)` 적용

---

## Chat Bubble

| 속성 | Desktop | Mobile |
|---|---|---|
| border-radius | `18 × scale` | `14 × scale` |
| background | `#ffffff` | `#ffffff` |
| boxShadow | `0 2px 8px rgba(0,0,0,0.06)` | 동일 |
| 외부 좌우 패딩 | `14 × scale` | 동일 |

### User bubble
- 오른쪽 정렬 (`justify: flex-end`)
- 최대 너비: 75%
- avatar: 22×22px (scale 적용), 원형

### Bot bubble
- 왼쪽 정렬 (`justify: flex-start`)
- 헤더: 10px 검정 점 + app name (`color: #999`)
- 텍스트 크기: `15 × fs` (fs = `Math.min(1, scale)`)

---

## Action Buttons

Bot bubble 직후 텍스트 버블에 inline으로 합쳐서 표시.
독립 블록으로 있을 경우 별도 bubble로 렌더링.

버튼 스타일:
```
background: #F3F4F6
color: #374151
borderRadius: 12px
padding: 11×scale px  16×scale px
fontSize: 14 × fs
```

---

## Product Cards

### 2개 이하 → 2열 그리드

```
display: grid
gridTemplateColumns: 1fr 1fr
gap: 8 × scale
padding: 0  16×scale px
```

### 3개 이상 → 가로 캐러셀

```
display: flex
overflowX: auto
scrollSnapType: x mandatory
paddingLeft: 14 × scale  (← bubble 왼쪽 엣지와 정렬)
gap: 8 × scale
카드 너비: 130 × scale px
```

### 카드 스타일

```
background:   #ffffff
borderRadius: 12px
boxShadow:    0 2px 8px rgba(0,0,0,0.06)
이미지:       aspect-ratio 2/1, object-fit cover
```

내부 패딩: `6px  10×scale px  8px`
- 제목: `14 × fs`, `fontWeight: 700`, `color: #111`
- 가격: `12 × fs`, `color: #6B7280`
- CTA 버튼: `background: #F3F4F6`, `color: #374151`, `borderRadius: 8px`, `padding: 6px 0`

---

## Checklist

Bubble 스타일 컨테이너 안에 리스트.

### 상태 아이콘

| 상태 | 아이콘 | 스타일 |
|---|---|---|
| `done` | SVG 체크마크 | 검정 원 (`#111`) + 흰 체크 |
| `in-progress` | SVG 3/4 arc | `stroke: #1a1a1a`, `strokeWidth: 2`, `strokeLinecap: round` |
| `pending` | 빈 원 | `border: 1.5px solid #D1D5DB` |

### 텍스트 스타일

- `done`: `color: #9CA3AF`, `text-decoration: line-through`
- 나머지: `color: #1a1a1a`
- 폰트 크기: `13 × fs`

---

## Status Pill

| 종류 | 배경 | 아이콘 | 텍스트 |
|---|---|---|---|
| `success` | `#F2FF66` | `✓` `#111111` | `#111111` |
| `warning` | `#2D1A00` | `!` `#FBBF24` | `#F9FAFB` |

```
borderRadius: 999 (full pill)
padding: 7×scale  14×scale
border: 1px solid iconColor
fontSize: 13 × fs
```

---

## Spacing & Message Gap

- 메시지 간 gap: `8 × scale`
- 메시지 리스트 패딩: top `14 × scale`, bottom `12px` (고정)
- 헤더 패딩: `16×scale  16×scale  14×scale`

---

## 색상 팔레트 (목업 내부)

| 용도 | 값 |
|---|---|
| Bubble 배경 | `#ffffff` |
| 앱 이름 / 타임스탬프 | `#999999` |
| 본문 텍스트 | `#1a1a1a` |
| 보조 텍스트 | `#6B7280` |
| 버튼/카드 배경 | `#F3F4F6` |
| 버튼 텍스트 | `#374151` |
| Checklist pending 원 | `#D1D5DB` |
| Bot indicator dot | `#111111` |

---

## Itinerary Card

일정/여행 플랜뿐 아니라 항공편 대안, 예약 옵션 리스트에도 사용한다.

- 선택적 `intro`: 카드 상단에 bot 설명문을 표시하며 최대 3줄로 클램프한다.
- Bot 카드 상단에는 항상 indicator dot과 app name을 표시한다.
- Group `label`은 선택 사항이며, 비어 있으면 날짜/섹션 헤더 영역을 렌더하지 않는다. Label 없는 group이 이어질 때는 row 간격과 동일하게 맞춘다.
- Row: icon, title, sub text, optional badge. Row vertical padding은 compact하게 유지한다.
- `badgeTone: "accent"`는 brand accent 토큰 강조 배지, 기본/`neutral`은 chat action background 토큰 배지.
- Badge는 한 줄 ellipsis 처리해 row 높이를 흔들지 않는다.

---

## Concept UI Callout

- AI callout은 라임색 glow/ring을 쓰지 않는다.
- 타겟 슬롯 강조와 popover는 중립 border/shadow 토큰만 사용한다.

---

## Product Visual Concept UI

- Concept UI 생성 전에는 텍스트 empty state 대신 샘플 대시보드를 캔버스에 표시해 결과물 형태를 먼저 이해할 수 있게 한다.
- Workspace scene은 editor, preview, AI tester의 3-column 구조를 기본으로 하는 Concept UI kit 패턴이다.
- if/else, condition, branching, outcome 같은 로직 표현은 새 archetype을 계속 늘리지 않고, Dashboard/Workspace/Builder/Modal scene 안에 재사용 `logicBlocks`로 삽입한다.
- policy/instruction, approval/review queue, tool/function call 같은 AI agent SaaS 패턴도 새 archetype 대신 `instructionSections`, `reviewQueues`, `toolCallLists` reusable block으로 받아낸다.
- 공개 AI agent product에서 반복되는 knowledge/procedure, testing/QA/observability, data connector/action 패턴은 별도 preset으로 복제하지 않고 기존 reusable block의 provider 단서와 copy variant로만 흡수한다.
- Hero crop으로 잘라낸 Concept UI 이미지는 외곽 corner radius를 유지한다.
- Floating panel에는 별도 screenshot polish/shadow를 추가하지 않고, 렌더된 패널 자체의 compact radius만 사용한다.
- Floating panel export는 고정 패널 높이가 아니라 실제 렌더된 content bounds를 캡처해 하단 카드나 대화가 잘리지 않게 한다.
- Concept UI builder scene은 첫 렌더 시 Floating panel을 기본 캡처로 사용해 canvas 전체가 얇은 hero crop처럼 보이지 않게 한다. 사용자가 이후 Hero crop을 직접 선택하는 것은 허용한다.
- Concept UI builder scene의 우측 config panel 안 reusable block callout은 floating popover가 아니라 inline callout으로 렌더해 canvas node와 겹치거나 export 영역에서 잘리지 않게 한다.
- Concept UI dashboard는 상단 header와 하단 body에 같은 compact radius를 적용해 모서리가 square로 보이지 않게 한다.
- Concept UI primary scene header는 로고와 title만 표시하고 productName/subtitle은 숨긴다.
- Concept UI primary scene header의 좌상단 브랜드 자리는 항상 delight mark를 사용하고 archetype별 로보트/테이블/워크플로우 아이콘으로 대체하지 않는다.
- Concept UI inbox의 AI agent 메시지 라벨 앞에는 로보트 아이콘을 쓰지 않고 작은 검은 원 표시를 사용한다.
- Concept UI modal은 배경 앱 화면을 테두리/둥근 shell 없이 흐린 full-bleed skeleton으로만 보여주고, 실제 카드/대시보드가 두 겹으로 보이지 않게 한다.
- Concept UI modal의 AI callout은 modal export 영역 안쪽에 배치해 오른쪽이 잘리지 않게 한다.
- Concept UI modal의 기본 copy에는 `AI pre-filled` 같은 데모용 문구를 쓰지 않고 `Ready to review`, `Generated draft`처럼 제품 UI에 가까운 문구를 사용한다.
- Concept UI table은 AI가 넓은 column width를 반환해도 primary panel 안에 맞도록 column 폭을 비례 축소해 오른쪽 컬럼이 잘리지 않게 한다.
- Concept UI table의 AI callout은 table row 위나 옆에 떠도 wrapper overflow에 잘리지 않게 표시한다.
- Concept UI table의 highlighted row는 배경색만 바꾸고 row 자체에 radius를 주지 않는다.
- Concept UI table typography는 dashboard보다 가볍게 유지한다. Title/primary cell은 700 이하, header/filter/person/date label은 600 중심으로 둔다.
