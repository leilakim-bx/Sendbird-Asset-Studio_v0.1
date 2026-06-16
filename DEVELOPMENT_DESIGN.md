# Development Design - Delight.ai Asset Studio

> 기준일: 2026-06-12 / 구현 기준 설계 요약

## 1. 구조 요약

Next.js App Router 기반의 클라이언트 중심 에디터다.  
UI 상태는 Zustand에 두고, 저장/초안은 localStorage에 persist한다.  
생성/업로드/Pexels 연동은 Next.js API route로 감싼다. 보안 정책상 외부 네트워크 호출은 Pexels 검색, Pexels 이미지 CDN, 승인된 Vercel Blob 작업 백업으로 제한한다.

```text
app/
  page.tsx                         홈: 템플릿 갤러리 + My files
  open/page.tsx                    저장 에셋 탭별 열기
  editor/[templateId]/page.tsx     템플릿 kind에 따라 Shell 분기
  api/*/route.ts                   로컬 생성, 업로드, Pexels 이미지 처리

components/
  editor/*                         Chat UI 에디터
  infographic/*                    Infographic 에디터
  product-visual/*                 Product Visual 에디터
  assets/AssetLibrary.tsx          저장 에셋 목록
  layout/*                         공통 레이아웃

lib/
  store.ts                         Zustand store + persist migration
  work-data-schema.ts              saved work schema version + migration entry points
  work-preservation.ts             automatic snapshots + backup file helpers
  work-remote-backup.ts            best-effort Vercel Blob snapshot sync client
  template-registry.ts             템플릿 등록/기본값
  types/*                          에셋별 데이터 모델
  export.ts                        공통 PNG/SVG export
  ai/*                             로컬 생성 결과 validation
```

## 2. 주요 라우팅

| Route | 역할 |
|---|---|
| `/` | 템플릿 선택, My files 표시 |
| `/open?type=chat\|infographic\|product-visual` | 저장 에셋을 Chat UI / Infographic / Product Visual 탭으로 분류. 홈 좌측 Finder 링크는 이 query로 1-depth 진입한다 |
| `/editor/[templateId]` | 템플릿 id 조회 후 Shell 렌더링 |
| `/api/generate-scenario` | Chat UI 로컬 프리셋 시나리오 생성 |
| `/api/analyze-article` | Infographic 로컬 추천 생성 |
| `/api/source-content` | 붙여넣은 소스 텍스트 정규화 |
| `/api/product-image` | Pexels 이미지 검색 |
| `/api/proxy-image` | Pexels 이미지 same-origin 프록시 |
| `/api/upload-background` | 커스텀 배경 이미지 업로드. Blob 연결 시 Blob URL, 미연결 개발 환경에서는 로컬 filesystem |
| `/api/upload-asset-image` | Product Visual 스크린샷 등 에셋 이미지 Blob 업로드 |
| `/api/work-backups` | Settings 복원을 위한 Vercel Blob 작업 스냅샷 저장/조회 |

## 3. 템플릿 분기

`lib/template-registry.ts`가 템플릿의 source of truth다.

| kind | templateId | Shell |
|---|---|---|
| `chat` | `feature-mockup` | `EditorShell` |
| `infographic` | `infographic` | `InfographicShell` |
| `product-visual` | `product-visual` | `ProductVisualShell` |

새 템플릿을 추가할 때는 `Template` union 타입, registry 기본값, Shell 분기, 저장 payload를 함께 갱신한다.

## 4. 상태 모델

| 상태 | 위치 | 설명 |
|---|---|---|
| 실시간 편집 상태 | `useEditorStore` | 현재 캔버스/사이드바 값 |
| 저장 에셋 | `savedAssets` persist | My files에 표시되는 완성본 snapshot. localStorage 보호를 위해 최근 24개까지만 유지 |
| 초안 | `drafts.chat`, `drafts.infographic` persist | 새로고침/크래시 복구 |
| 복원 대상 | `pendingAssetRestore` transient | My files에서 에디터로 넘기는 일회성 값 |
| 자동 작업 스냅샷 | `asset-studio-work-backups-v1` localStorage + optional Vercel Blob | template 작업 단위별 최근 5개 보존. 메인 UI 노출 없음 |
| Product Visual | transient + saved asset + 자동 작업 스냅샷 | draft autosave 없음, Save 시 snapshot 저장 |

persist 키는 `sendbird-editor-v1`, 현재 version은 `5`다.
마이그레이션은 구 메시지 포맷 변환, retired template 제거, persisted 컬렉션 상한 정리, saved work `schemaVersion` 부여를 처리한다.

저장되는 작업 데이터는 모두 `schemaVersion: 5`를 가진다. 현재 마이그레이션 레이어는 `lib/work-data-schema.ts`에 있으며 구 메시지 포맷 정리, retired template 제거, persisted 컬렉션 상한 정리, saved work `schemaVersion` 부여를 거친 뒤 v4 -> v5에서 `process-loop` 타입 추가에 따른 구조 호환 migration을 수행한다. 이후 구조 변경 시 `vN -> vN+1` 변환 함수를 추가하는 구조다.

## 5. 저장/복원 흐름

```text
Save 클릭
  -> off-screen canvas thumbnail capture
  -> SavedAsset 생성
  -> localStorage savedAssets prepend (최근 24개까지만 유지)

My files / Finder에서 열기
  -> pendingAssetRestore 설정
  -> /editor/{templateId} 이동
  -> Shell mount 시 pending snapshot 복원
  -> pendingAssetRestore clear

작업 중 변경
  -> Shell별 `useWorkAutosnapshot` debounce
  -> 작업 단위별 최근 5개 스냅샷 저장
  -> Blob credentials가 있으면 같은 스냅샷을 Blob에도 best-effort 저장
  -> UI 노출 없음

Settings 메뉴
  -> Restore previous version: localStorage와 Blob 스냅샷 목록에서 선택 복원
  -> Save backup file: 현재 작업을 백업 파일로 다운로드
  -> Load backup: 백업 파일을 읽고 schemaVersion 확인/마이그레이션 후 복원
  -> 복원 직전 현재 상태도 자동 스냅샷으로 보존
```

`SavedAsset`은 템플릿별 snapshot을 선택적으로 가진다.

| template | snapshot field |
|---|---|
| Chat UI | `messages`, `backgroundId`, `layout`, `exportSize`, `userName`, `userAvatarUrl` |
| Infographic | `infographic` |
| Product Visual | `productVisual` |

## 6. Export 설계

공통 export는 `lib/export.ts`가 담당한다.

| 단계 | 설명 |
|---|---|
| 1 | export 전 캔버스 내부 `<img>`를 fetch 후 data URL로 inline |
| 2 | `html-to-image`로 Blob 생성 |
| 3 | File System Access API 가능 시 save picker 사용 |
| 4 | 불가능하면 object URL download fallback |
| 5 | object URL revoke로 메모리 정리 |

기본 출력은 `pixelRatio: 2`의 @2x PNG다.  
모바일/블로그/가변 포맷은 height를 넘기지 않고 자연 높이를 캡처한다.

## 7. API 설계

### Local generation routes

| Route | 입력 | 출력 | 검증 |
|---|---|---|---|
| `/api/generate-scenario` | `{ prompt }` | `{ messages }` | `validateScenario` |
| `/api/analyze-article` | `{ article }` | `{ suggestions }` | `validateSuggestions` |
| `/api/work-backups` | `{ clientId, snapshot }` or query | `{ saved }` / `{ snapshots }` | `schemaVersion` migration |

공통 규칙:

- 외부 LLM 호출 금지
- 로컬 프리셋/규칙 기반 결과만 생성
- 생성 결과는 validator 통과 결과만 클라이언트에 반환
- malformed 결과는 사용자 재시도/입력 보강 메시지로 처리

### Upload routes

| Route | 허용 타입 | 제한 | 저장소 |
|---|---|---|---|
| `/api/upload-background` | jpg, png, webp, gif | 10MB | `public/background` |
| `/api/upload-asset-image` | jpg, png, webp | 10MB | Vercel Blob public objects |
| `/api/work-backups` | work snapshot payload | 3.5MB | Vercel Blob private objects |

Product Visual 스크린샷은 Blob이 연결된 환경에서 `/api/upload-asset-image`를 통해 Blob public URL로 저장한다. Blob 미연결 로컬 개발 환경에서는 2MB 이하 이미지에 한해 data URL fallback을 사용한다. 저장 snapshot에는 URL과 natural dimensions만 유지해 localStorage payload를 작게 유지한다.
Reference Rebuild는 현재 marketer-facing UI에서 archived 상태다. 기존 타입/코드 경로는 향후 품질 개선 후 재활성화할 수 있게 남기되, 서버/저장소 업로드 없이 세션 중 object URL만 사용하는 원칙을 유지한다.
커스텀 배경은 Blob이 연결된 환경에서 Blob URL로 저장하고, Blob 미연결 개발 환경에서는 `/public/background` 로컬 filesystem fallback을 사용한다. localStorage 보호를 위해 최근 20개까지만 유지한다.

Vercel Blob 작업 백업은 localStorage 자동 스냅샷의 보조 안전망이다. 클라이언트는 브라우저별 `asset-studio-work-backup-client-v1` id를 만들고, 서버 route는 `work-backups/{clientId}/{kind}/{templateId}/` 아래 최근 5개만 유지한다. Blob 토큰이 없거나 스냅샷이 3.5MB를 넘으면 클라우드 동기화만 건너뛰며, 메인 작업 흐름과 로컬 백업은 실패시키지 않는다.
Vercel Blob 에셋 이미지는 `asset-images/{purpose}/{date}/` 아래 저장한다. 이 URL은 canvas `<img>`와 PNG export inline 단계에서 직접 읽어야 하므로 public object를 사용한다. 민감한 고객 데이터 스크린샷은 업로드하지 않는 운영 가이드가 필요하다.

## 8. 외부 서비스

| 서비스 | 용도 | 필수 여부 |
|---|---|---|
| Pexels | product card 이미지 검색 | 선택, 미설정 시 해당 기능 제한 |
| Vercel | 배포/접근 보호 | 운영 권장 |
| Vercel Blob | 업로드 이미지 저장 + 작업 스냅샷 보조 백업 | 선택, 미설정 시 localStorage/local filesystem fallback |

Pexels와 승인된 Vercel Blob 외부 호출만 허용한다. 임의 URL import, 외부 LLM, 승인되지 않은 외부 object storage 업로드는 사용하지 않는다.

## 9. 데이터 모델 핵심

| 모델 | 파일 | 핵심 필드 |
|---|---|---|
| `ChatMessage` | `lib/store.ts` | `role`, `sender`, `block` |
| `ChatDraft` | `lib/store.ts` | `schemaVersion`, `messages`, `backgroundId`, `layout`, `exportSize` |
| `InfographicContent` | `lib/types/infographic.ts` | `schemaVersion`, `format`, `bg`, `accent`, `blocks` |
| `ProductVisualContent` | `lib/types/product-visual.ts` | `schemaVersion`, `format`, `layout`, `bg`, `sourceMode`, `screenshot`, `concept`, `reference`, `conceptScene` |
| `SavedAsset` | `lib/store.ts` | `schemaVersion`, `id`, `templateId`, `previewDataUrl`, snapshot fields |

## 10. 에디터별 설계

### Chat UI

- `EditorShell`이 상태 복원, autosave, 저장, export를 관리한다.
- Settings 메뉴에서 restore/backup file 기능을 제공하되, main editing flow에는 노출하지 않는다.
- `FormPanel`이 메시지/배경/레이아웃 편집을 담당한다.
- `FeatureMockup`이 실제 export 캔버스를 렌더링한다.
- Chat UI Create from brief는 외부 LLM 없이 `lib/ai/chat-scenario-generator.ts`의 점수 기반 intent router를 사용한다. 단일 키워드 선착순이 아니라 더 구체적인 intent를 우선하며, `call` 같은 넓은 단어는 `phone call`, `outbound call`, `voice`처럼 voice-specific 문맥에서만 Voice card로 라우팅한다.
- Chat UI prompt helper는 가벼운 `Customer goal`, `Agent action`, `Outcome`, 선택적 `Avoid` guidance를 제공하고, router가 이 필드를 직접 파싱해 intent boost와 제외 조건으로 반영한다. 이전 `Scenario`, `User goal`, `Must show`, `Do not show` 필드도 붙여넣기 호환성을 위해 계속 읽는다.
- `single interaction`, `without transfers`, `follow-ups`, `repeated calls`, `fragmented handoffs` 같은 문구는 handoff/voice preset보다 `single-interaction` resolution preset으로 우선 라우팅한다.
- `itinerary` 블록은 bot sender header를 유지하고, 선택적 `intro`, 선택적 group `label`, row-level `badge`/`badgeTone`을 지원해 일정뿐 아니라 항공편 대안, 예약 옵션 카드로도 재사용한다.
- 모바일 export는 콘텐츠 높이에 따라 가변 캡처한다.
- 캔버스 overflow 시 단일 메시지 append는 rollback하고, 시나리오 교체 등은 경고만 표시한다.

### Infographic

- `InfographicShell`이 product/blog export canvas를 둘 다 관리한다.
- Settings 메뉴에서 restore/backup file 기능을 제공하되, source/create flow와 분리한다.
- `InfographicSidebar`가 블록 편집과 source 기반 추천 UI를 담당한다.
- Infographic 첫 진입 template seed는 title 없는 Orbit diagram으로 시작한다.
- 붙여넣은 기사/데이터/source guidance는 `/api/source-content`에서 정규화 후 후보 생성에 사용한다.
- Infographic source helper는 가벼운 `Main message`, `Structure`, `Proof points`, 선택적 `Avoid` guidance를 제공하고, extractor가 이 필드를 직접 파싱해 block ranking, proof-point fallback, 제외 조건에 반영한다. 이전 `Main claim`, `Preferred block`, `Do not show` 필드도 붙여넣기 호환성을 위해 계속 읽는다.
- rule-based 후보를 선택해 여러 이미지를 한 번에 export할 수 있다.
- Source 후보 생성은 저장/렌더 가능한 기존 Infographic 블록 템플릿 안에서만 변주한다. 자연어/기사 입력은 `stat`, `kpi-group`, `card-grid`, `bar-group`, `step`, `process-loop`, `stack`, `node-list`, `compare`, `stacked-bar`, `line-chart`, `orbit` 후보로 랭킹되며, 별도 하드코딩 마케팅 배너 레이아웃을 만들지 않는다.
- Source 후보 생성은 `lib/infographic-article-extractor.ts`에서 source intent를 먼저 점수화한 뒤 후보별 score를 정렬한다. 짧은 value prop copy도 숫자가 없다는 이유로 generic card에만 머물지 않게 하며, `single interaction`, `without transfers`, `follow-ups`, `repeated calls`, `fragmented handoffs` 계열은 compare/step/card 후보를 우선 생성한다.
- 후보 목록은 같은 block type이 반복되어 보이지 않도록 우선 고유 block type 위주로 채우고, 부족할 때만 추가 후보로 보강한다.
- 블록별 입력 상한은 `lib/infographic-block-limits.ts`가 source of truth다. 사이드바는 Add 버튼/입력 길이를 이 값으로 제한하고, 각 block renderer도 같은 값으로 slice해 저장 데이터가 과해도 export 프레임이 깨지지 않게 한다.
- Process loop(`process-loop`)은 linear process와 dotted feedback return을 표현하는 library-only 블록이며 Product feature에서 최대 5개 step, Blog/Perspective에서 최대 6개 step으로 제한한다.
- Layer diagram(`stack`)은 Product feature 고정 프레임에서 최대 3개 layer, Blog/Perspective에서 최대 4개 layer로 제한한다.

### Product Visual

- `ProductVisualShell`은 저장/export와 preview scaling을 담당한다.
- Product Visual은 draft autosave 대신 자동 작업 스냅샷과 Settings backup file 기능을 사용한다.
- `ProductVisualSidebar`는 포맷, 배경, 스크린샷, crop/highlight, Concept UI를 편집한다. Reference Rebuild mode는 archived 상태로 UI에 노출하지 않는다.
- 포맷별 크기/레이아웃 제약은 `FORMAT_SIZES`, `FORMAT_LAYOUTS`에 둔다.
- Product Feature 포맷은 Concept UI source만 허용하며 Screenshot upload/source는 비활성화한다.
- `concept` 모드는 현재 deterministic UI builder로 제품 UI 느낌의 가상 화면을 만든다.
- `reference` 모드는 archived 상태다. 기존 저장본이 `reference`를 가지고 있어도 런타임에서는 Concept UI scene처럼 렌더한다.
- Concept UI scene spec은 Dashboard/Workspace/Builder/Modal 안에 optional reusable blocks를 받을 수 있다. `logicBlocks`, `controlPanels`, `autonomyMatrices`, `knowledgeCoverages`, `evaluationScorecards`, `integrationHealths`, `channelMatrices`, `instructionSections`, `reviewQueues`, `toolCallLists`, `actionTrails`, `improvementSignals`, `validationLoops`는 if/else, self-service control, autonomy/permission, knowledge coverage, evaluation, integration health, channel performance, policy, approval, tool/function call, visible agent action log, production signal, self-validation 단서에 따라 새 source/structure 선택지를 만들지 않고 삽입된다.
- Generic resolution/procedure/agent flow 단서는 Builder canvas로 고정하지 않고 Dashboard kit + reusable blocks로 라우팅한다. Builder는 workflow editor/canvas/actionbook/node/rule authoring이 명시된 경우에 우선한다.
- Product Visual 첫 진입은 저장 데이터에 샘플을 seed하지 않고, 왼쪽 preview에 Concept UI 샘플 대시보드만 placeholder로 보여준다.
- Concept UI export는 Hero crop/Floating panel 모두 전체 scene 배경이 아니라 primary panel만 screenshot pipeline으로 넘긴다. Hero crop은 이후 crop selector를 여는 UX 차이만 가진다.
- 외부 AI chat으로 만든 Concept UI 답변은 서버 API 없이 클라이언트에서 JSON을 추출/검증한다. Studio SceneSpec과 다른 구조라도 archetype 의도가 명확하면 가장 가까운 지원 layout sample로 변환하고, table cell의 `kind`처럼 누락이 잦은 필드는 column 정보로 보정한다. 의도 자체를 알 수 없는 구조만 에러로 처리한다.
- SceneSpec JSON 직접 import/export는 일반 Concept UI 플로우와 분리해 `Developer tools` 섹션에 둔다.

## 11. 환경 변수

| 변수 | 설명 |
|---|---|
| `PEXELS_API_KEY` | Pexels 이미지 검색 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 업로드 이미지와 작업 스냅샷 저장/조회. Vercel Storage 연결 시 token 방식에서 자동 주입 |
| `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN` | Vercel Blob OIDC 연결 방식. `BLOB_READ_WRITE_TOKEN`이 없어도 Blob operations에 사용 |

## 12. 운영 전환 체크리스트

- `PEXELS_API_KEY` 설정 후 product image search 검증
- Vercel Blob Store 연결 후 `BLOB_READ_WRITE_TOKEN` 또는 `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`이 Production/Preview/Development에 주입됐는지 확인
- Vercel protection 또는 인증 정책 적용
- localStorage 저장 한계 테스트: 큰 screenshot, 다수 saved asset
- 대표 템플릿별 PNG export QA: Desktop, Mobile, Blog, Release Thumbnail

## 13. 테스트 전략

| 영역 | 최소 검증 |
|---|---|
| 타입/빌드 | `npm run lint`, `npm run build` |
| 생성 validator | `validateScenario`, `validateSuggestions`가 malformed 응답을 drop하는지 확인 |
| 저장/복원 | Save -> My files -> reopen 시 snapshot이 동일하게 복원되는지 확인 |
| Autosave | Chat UI/Infographic에서 새로고침 후 draft가 복구되는지 확인 |
| 작업 보존 | 자동 스냅샷 최근 5개 유지, Settings restore, backup file 저장 -> 불러오기 round-trip 확인 |
| Blob 백업 | 토큰 없음 fallback, 3.5MB 초과 skip, local+remote 복원 목록 병합 확인 |
| Export | 각 템플릿 대표 포맷 PNG가 지정 크기/@2x로 생성되는지 확인 |
| Infographic limits | 블록별 item/text 상한이 에디터와 renderer 양쪽에서 적용되는지 확인 |
| Concept UI render quality | bundled sample과 max-length English fixture가 `SceneRenderer`에서 빈 화면/불안정 markup 없이 렌더되는지 확인 |
| Concept UI browser QA | Playwright로 `/dev/concept-ui/render`를 열어 각 샘플/fixture를 스크린샷 캡처하고 primary panel, broken image, canvas overflow, 금지 demo copy를 확인 |
| 업로드 | 배경/Product Visual 허용 타입/10MB 제한, Blob URL 저장, Blob 미연결 fallback 확인 |
| 소스 입력 | URL-only 거부, 텍스트 붙여넣기 케이스 확인 |

테스트 우선순위는 validator, 저장/복원, export 순서다. 이 세 영역은 깨지면 사용자가 만든 결과물이 손상되거나 다운로드가 불가능해진다.

검증 명령:

- `npm run test:run` — 단위 테스트
- `npm run test:visual` — Concept UI 브라우저 렌더 smoke QA
- `npm run verify:core` — 단위 테스트 + production build
- `npm run verify` — lint + 단위 테스트 + production build

## 14. 실패 처리 기준

| 실패 영역 | 사용자 처리 | 개발 처리 |
|---|---|---|
| 생성 schema 검증 실패 | 사용 가능한 결과가 없으면 에러 표시 | validator에서 malformed item drop |
| 이미지 업로드 실패 | 파일 타입/크기/업로드 실패 이유 표시 | 배경은 local filesystem, 스크린샷은 브라우저 local 처리 |
| Pexels 이미지 CORS | export가 중단되지 않게 처리 | Pexels-only proxy 또는 export 전 data URL inline |
| localStorage quota 초과 | 저장 실패 메시지 표시 | 큰 data URL 저장 최소화, Blob 보조 백업 병행 |
| Blob 백업 실패 | 메인 작업 흐름에는 노출하지 않음 | 자동 스냅샷은 localStorage에 남기고 remote sync만 skip |
| URL-only source 입력 | 텍스트 붙여넣기 안내 | 서버에서 URL fetch 금지 |
| Export 실패 | 다운로드 실패 메시지 표시 | object URL cleanup, canvas ref null guard |

실패는 조용히 무시하지 않는다. 사용자가 다음 행동을 알 수 있는 메시지를 보여주고, 민감한 API 응답이나 secret은 화면/로그에 노출하지 않는다.

## 15. 릴리즈 체크리스트

릴리즈 전 최소 확인:

- `npm run lint`
- `npm run build`
- Chat UI: scenario 선택, 로컬 생성, save/reopen, desktop/mobile export
- Infographic: block 편집, source text 입력, product/blog export
- Product Visual: screenshot 업로드, crop 변경, concept mode, format별 export
- My files: 검색, rename, delete, reopen
- 업로드: 허용 파일과 거부 파일 각각 확인
- 환경변수: `PEXELS_API_KEY` 설정 여부 확인
- 운영 접근: Vercel protection 또는 인증 정책 확인

릴리즈 후 확인:

- 실제 배포 URL에서 대표 export 1회 실행
- `/api/generate-scenario`, `/api/analyze-article` 로컬 생성 route 각 1회 실행

## 16. 변경 원칙

- UI는 `components/*`, 비즈니스 로직은 `lib/*`, 서버 연동은 `app/api/*`에 둔다.
- 외부 네트워크 호출은 Pexels로 제한하고, 나머지는 로컬 프리셋/규칙/fallback 경로를 유지한다.
- 새 블록 추가 시 타입, renderer, editor, validator, preset을 함께 수정한다.
- export 결과는 화면 preview가 아니라 off-screen full-size canvas를 기준으로 한다.
- 저장 포맷 변경 시 persist migration을 추가한다.
- Next.js 구현 전에는 `node_modules/next/dist/docs/`의 관련 가이드를 확인한다.
