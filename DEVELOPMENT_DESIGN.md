# Development Design - Delight.ai Asset Studio

> 기준일: 2026-06-12 / 구현 기준 설계 요약

## 1. 구조 요약

Next.js App Router 기반의 클라이언트 중심 에디터다.  
UI 상태는 Zustand에 두고, 저장/초안은 localStorage에 persist한다.  
AI/업로드/프록시는 Next.js API route로 감싸 브라우저에서 외부 키를 직접 다루지 않는다.

```text
app/
  page.tsx                         홈: 템플릿 갤러리 + My files
  open/page.tsx                    저장 에셋 탭별 열기
  editor/[templateId]/page.tsx     템플릿 kind에 따라 Shell 분기
  api/*/route.ts                   AI, 업로드, 이미지 프록시, 소스 import

components/
  editor/*                         Chat UI 에디터
  infographic/*                    Infographic 에디터
  product-visual/*                 Product Visual 에디터
  assets/AssetLibrary.tsx          저장 에셋 목록
  layout/*                         공통 레이아웃

lib/
  store.ts                         Zustand store + persist migration
  template-registry.ts             템플릿 등록/기본값
  types/*                          에셋별 데이터 모델
  export.ts                        공통 PNG/SVG export
  ai/*                             AI prompt/validation
  storage/r2.ts                    R2 업로드 어댑터
```

## 2. 주요 라우팅

| Route | 역할 |
|---|---|
| `/` | 템플릿 선택, My files 표시 |
| `/open` | 저장 에셋을 Chat UI / Infographic / Product Visual 탭으로 분류 |
| `/editor/[templateId]` | 템플릿 id 조회 후 Shell 렌더링 |
| `/api/generate-scenario` | Chat UI AI 시나리오 생성 |
| `/api/analyze-article` | Infographic AI 추천 생성 |
| `/api/source-content` | URL/텍스트에서 기사 본문 추출 |
| `/api/product-image` | Pexels 이미지 검색 |
| `/api/proxy-image` | 외부 이미지 same-origin 프록시 |
| `/api/upload-background` | 배경 이미지 업로드 |
| `/api/upload-product-visual-screenshot` | Product Visual 스크린샷 업로드 |

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
| 저장 에셋 | `savedAssets` persist | My files에 표시되는 완성본 snapshot |
| 초안 | `drafts.chat`, `drafts.infographic` persist | 새로고침/크래시 복구 |
| 복원 대상 | `pendingAssetRestore` transient | My files에서 에디터로 넘기는 일회성 값 |
| Product Visual | transient + saved asset | autosave 없음, Save 시 snapshot 저장 |

persist 키는 `sendbird-editor-v1`, 현재 version은 `2`다.  
마이그레이션은 구 메시지 포맷 변환과 retired template 제거를 처리한다.

## 5. 저장/복원 흐름

```text
Save 클릭
  -> off-screen canvas thumbnail capture
  -> SavedAsset 생성
  -> localStorage savedAssets prepend

My files에서 열기
  -> pendingAssetRestore 설정
  -> /editor/{templateId} 이동
  -> Shell mount 시 pending snapshot 복원
  -> pendingAssetRestore clear
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

### AI routes

| Route | 입력 | 출력 | 검증 |
|---|---|---|---|
| `/api/generate-scenario` | `{ prompt }` | `{ messages }` | `validateScenario` |
| `/api/analyze-article` | `{ article }` | `{ suggestions }` | `validateSuggestions` |

공통 규칙:

- `ANTHROPIC_API_KEY=mock`이면 외부 호출 없이 fixture 반환
- live 호출은 서버에서만 실행
- 모델 응답은 JSON parse 후 validator 통과 결과만 클라이언트에 반환
- malformed 결과는 5xx/사용자 재시도 메시지로 처리

### Upload routes

| Route | 허용 타입 | 제한 | 저장소 |
|---|---|---|---|
| `/api/upload-background` | jpg, png, webp, gif | 10MB | R2 또는 `public/background` |
| `/api/upload-product-visual-screenshot` | jpg, png, webp | 10MB | R2 또는 `public/product-visual` |

R2 환경변수가 있으면 R2를 사용하고, 없으면 개발용 filesystem fallback을 사용한다.

## 8. 외부 서비스

| 서비스 | 용도 | 필수 여부 |
|---|---|---|
| Anthropic | AI 시나리오/추천 생성 | 선택, mock 가능 |
| Pexels | product card 이미지 검색 | 선택, 미설정 시 해당 기능 제한 |
| Cloudflare R2 | 업로드 이미지 운영 저장소 | 선택, 로컬 fallback 가능 |
| Vercel | 배포/접근 보호 | 운영 권장 |

## 9. 데이터 모델 핵심

| 모델 | 파일 | 핵심 필드 |
|---|---|---|
| `ChatMessage` | `lib/store.ts` | `role`, `sender`, `block` |
| `InfographicContent` | `lib/types/infographic.ts` | `format`, `bg`, `accent`, `blocks` |
| `ProductVisualContent` | `lib/types/product-visual.ts` | `format`, `layout`, `bg`, `screenshot`, `concept` |
| `SavedAsset` | `lib/store.ts` | `id`, `templateId`, `previewDataUrl`, snapshot fields |

## 10. 에디터별 설계

### Chat UI

- `EditorShell`이 상태 복원, autosave, 저장, export를 관리한다.
- `FormPanel`이 메시지/배경/레이아웃 편집을 담당한다.
- `FeatureMockup`이 실제 export 캔버스를 렌더링한다.
- 모바일 export는 콘텐츠 높이에 따라 가변 캡처한다.
- 캔버스 overflow 시 단일 메시지 append는 rollback하고, 시나리오 교체 등은 경고만 표시한다.

### Infographic

- `InfographicShell`이 product/blog export canvas를 둘 다 관리한다.
- `InfographicSidebar`가 블록 편집과 AI 분석 UI를 담당한다.
- 기사 URL은 `/api/source-content`로 본문 추출 후 후보 생성에 사용한다.
- AI 후보와 rule-based 후보를 선택해 여러 이미지를 한 번에 export할 수 있다.

### Product Visual

- `ProductVisualShell`은 저장/export와 preview scaling을 담당한다.
- `ProductVisualSidebar`는 포맷, 배경, 스크린샷, crop/highlight, concept mode를 편집한다.
- 포맷별 크기/레이아웃 제약은 `FORMAT_SIZES`, `FORMAT_LAYOUTS`에 둔다.
- `concept` 모드는 현재 deterministic UI builder로 제품 UI 느낌의 가상 화면을 만든다.

## 11. 환경 변수

| 변수 | 설명 |
|---|---|
| `ANTHROPIC_API_KEY` | 없거나 `mock`이면 mock path |
| `PEXELS_API_KEY` | Pexels 이미지 검색 |
| `R2_ACCOUNT_ID` | R2 사용 시 필요 |
| `R2_ACCESS_KEY_ID` | R2 사용 시 필요 |
| `R2_SECRET_ACCESS_KEY` | R2 사용 시 필요 |
| `R2_BUCKET_NAME` | R2 사용 시 필요 |
| `R2_PUBLIC_URL` | R2 public asset base URL |

## 12. 운영 전환 체크리스트

- `ANTHROPIC_API_KEY` live key로 시나리오/분석 route 검증
- `PEXELS_API_KEY` 설정 후 product image search 검증
- R2 환경변수 설정 후 업로드 URL과 public read 검증
- Vercel protection 또는 인증 정책 적용
- localStorage 저장 한계 테스트: 큰 screenshot, 다수 saved asset
- 대표 템플릿별 PNG export QA: Desktop, Mobile, Blog, Release Thumbnail

## 13. 테스트 전략

| 영역 | 최소 검증 |
|---|---|
| 타입/빌드 | `npm run lint`, `npm run build` |
| AI validator | `validateScenario`, `validateSuggestions`가 malformed 응답을 drop하는지 확인 |
| 저장/복원 | Save -> My files -> reopen 시 snapshot이 동일하게 복원되는지 확인 |
| Autosave | Chat UI/Infographic에서 새로고침 후 draft가 복구되는지 확인 |
| Export | 각 템플릿 대표 포맷 PNG가 지정 크기/@2x로 생성되는지 확인 |
| 업로드 | 허용 타입/10MB 제한/R2 fallback 경로 확인 |
| 소스 import | 공개 URL, 보호 URL, 텍스트 붙여넣기 케이스 확인 |

테스트 우선순위는 validator, 저장/복원, export 순서다. 이 세 영역은 깨지면 사용자가 만든 결과물이 손상되거나 다운로드가 불가능해진다.

검증 명령:

- `npm run test:run` — 단위 테스트
- `npm run verify:core` — 단위 테스트 + production build
- `npm run verify` — lint + 단위 테스트 + production build

## 14. 실패 처리 기준

| 실패 영역 | 사용자 처리 | 개발 처리 |
|---|---|---|
| AI JSON 파싱 실패 | 재시도/프롬프트 수정 메시지 표시 | raw 응답을 클라이언트에 노출하지 않음 |
| AI schema 검증 실패 | 사용 가능한 결과가 없으면 에러 표시 | validator에서 malformed item drop |
| 이미지 업로드 실패 | 파일 타입/크기/업로드 실패 이유 표시 | R2 실패 시 500, 개발 환경은 filesystem fallback |
| 외부 이미지 CORS | export가 중단되지 않게 처리 | proxy 또는 export 전 data URL inline |
| localStorage quota 초과 | 저장 실패 메시지 표시 | 큰 data URL 저장 최소화, DB/R2 이전 검토 |
| URL import 실패 | 텍스트 붙여넣기 안내 | auth wall/private IP/timeout 분기 |
| Export 실패 | 다운로드 실패 메시지 표시 | object URL cleanup, canvas ref null guard |

실패는 조용히 무시하지 않는다. 사용자가 다음 행동을 알 수 있는 메시지를 보여주고, 민감한 API 응답이나 secret은 화면/로그에 노출하지 않는다.

## 15. 릴리즈 체크리스트

릴리즈 전 최소 확인:

- `npm run lint`
- `npm run build`
- Chat UI: scenario 선택, AI mock 생성, save/reopen, desktop/mobile export
- Infographic: block 편집, source import, AI mock 분석, product/blog export
- Product Visual: screenshot 업로드, crop 변경, concept mode, format별 export
- My files: 검색, rename, delete, reopen
- 업로드: 허용 파일과 거부 파일 각각 확인
- 환경변수: `ANTHROPIC_API_KEY`, `PEXELS_API_KEY`, R2 관련 값 설정 여부 확인
- 운영 접근: Vercel protection 또는 인증 정책 확인

릴리즈 후 확인:

- 실제 배포 URL에서 대표 export 1회 실행
- AI live key를 쓰는 경우 `/api/generate-scenario`, `/api/analyze-article` 각 1회 실행
- R2를 쓰는 경우 업로드 파일 public URL 접근 확인

## 16. 변경 원칙

- UI는 `components/*`, 비즈니스 로직은 `lib/*`, 서버 연동은 `app/api/*`에 둔다.
- 외부 API는 항상 mock/fallback 경로를 유지한다.
- 새 블록 추가 시 타입, renderer, editor, validator, preset을 함께 수정한다.
- export 결과는 화면 preview가 아니라 off-screen full-size canvas를 기준으로 한다.
- 저장 포맷 변경 시 persist migration을 추가한다.
- Next.js 구현 전에는 `node_modules/next/dist/docs/`의 관련 가이드를 확인한다.
