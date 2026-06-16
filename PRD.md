# PRD - Delight.ai Asset Studio

> Sendbird 마케팅팀 사내 에셋 제작 스튜디오\
> 기준일: 2026-06-12 / 상태: MVP 고도화 중

## 1. 제품 요약

Delight.ai Asset Studio는 마케터가 디자이너 의존 없이 제품 마케팅용 이미지를 직접 만드는 사내 웹툴이다.

핵심 흐름은 **템플릿 선택 -> 내용 편집 -> 이미지 저장/PNG export**다.

## 2. 문제 정의

| 문제 | 영향 |
|---|---|
| 데모 이미지, 릴리즈 썸네일, 인포그래픽 제작이 디자이너에게 집중됨 | 캠페인/블로그/릴리즈 제작 속도 저하 |
| 같은 유형의 이미지를 매번 새로 디자인함 | 브랜드 일관성 저하, 반복 작업 증가 |
| 마케터가 직접 수정하기 어려움 | 작은 문구/수치 변경도 병목 발생 |

## 3. 목표

- 마케터가 5분 안에 마케팅용 이미지를 만들 수 있게 한다.
- Chat UI, Infographic, Product Visual 3개 에셋 유형을 한 스튜디오에서 관리한다.
- 초안 생성/추천은 외부 LLM 없이 로컬 프리셋과 규칙 기반 로직으로 제공한다.
- 저장, 재편집, PNG export까지 브라우저에서 완료한다.

## 4. 사용자

| 구분 | 설명 |
|---|---|
| 주 사용자 | Sendbird/Delight.ai 마케팅, PMM, 콘텐츠 담당자 |
| 사용 빈도 | 릴리즈, 블로그, 캠페인, 세일즈 자료 제작 시 반복 사용 |
| 기술 수준 | 디자인 툴/코딩 지식 없이 사용 가능해야 함 |
| 권한 | MVP에서는 사용자별 권한 분리 없음 |

## 5. 핵심 사용 시나리오

1. 사용자는 홈에서 템플릿을 선택한다.
2. 에디터에서 문구, 데이터, 배경, 스크린샷, 레이아웃을 수정한다.
3. 필요한 경우 프리셋/규칙 기반 생성 기능으로 초안을 만든다.
4. 결과를 My files에 저장한다.
5. PNG로 다운로드해 블로그, 웹, 슬라이드, 소셜 콘텐츠에 사용한다.

## 6. 템플릿 범위

### 6.1 Chat UI

| 항목 | 요구사항 |
|---|---|
| 목적 | AI agent 대화 흐름을 제품 데모 이미지로 제작 |
| 포맷 | Desktop 866x660, Mobile 343x가변 |
| 레이아웃 | Center, Split |
| 블록 | text, actions, products, checklist, status, voice, itinerary(bot header, 상단 설명문, optional 날짜 라벨, row badge 지원) |
| 편집 | 앱 이름, 유저 이름/아바타, 메시지, 배경, 레이아웃, export size |
| 생성 | 프롬프트를 로컬 시나리오 프리셋으로 매칭 |

### 6.2 Infographic

| 항목 | 요구사항 |
|---|---|
| 목적 | 블로그/리포트/제품 메시지를 시각 자료로 변환 |
| 포맷 | Product 866x660, Blog 664x가변 |
| 블록 | stat, kpi-group, card-grid, bar-group, step, process-loop, stack, node-list, compare, stacked-bar, line-chart, orbit |
| 편집 | 제목, 푸트노트, 배경, accent color, 블록 추가/수정/삭제 |
| 생성 | 붙여넣은 텍스트/데이터를 규칙 기반으로 인포그래픽 후보 추천 |
| 소스 입력 | 텍스트, 차트 데이터, source guidance 붙여넣기 |
| 안전장치 | 블록별 항목/텍스트 상한을 둬 Product/Blog 포맷에서 export 가능한 구성을 유지 |

### 6.3 Product Visual

| 항목 | 요구사항 |
|---|---|
| 목적 | 실제 제품 스크린샷을 릴리즈/블로그용 이미지로 정리 |
| 포맷 | Feature Desktop, Feature Mobile, Release Thumbnail, Release Insert, Blog |
| 입력 | 스크린샷 업로드, Concept UI 설명 입력 |
| 편집 | crop/highlight, 제목, 부제, 배경, 포맷별 레이아웃 |
| Export | 포맷별 정확한 PNG 크기 또는 가변 높이 |

## 7. 공통 기능

| 기능 | 요구사항 |
|---|---|
| 홈 | 템플릿 갤러리와 My files 표시 |
| My files | 저장한 에셋 검색, 리스트/그리드 보기, 이름 변경, 삭제, 재편집 |
| 저장 | 썸네일과 편집 상태를 브라우저 localStorage에 저장. 용량 보호를 위해 최근 저장 에셋과 커스텀 배경은 상한을 둔다. |
| Autosave | Chat UI, Infographic 작업 초안 자동 저장 |
| 작업 보존 | 모든 저장 작업 데이터는 `schemaVersion`을 가지며, 변경 시 작업 단위별 최근 5개 자동 스냅샷을 보존한다. Vercel Blob이 연결된 배포에서는 같은 스냅샷을 클라우드에도 best-effort로 보존한다. 복원/백업 파일 기능은 Settings 안에만 둔다. |
| Export | `html-to-image` 기반 @2x PNG 다운로드 |
| 이미지 업로드 | Product Visual 스크린샷과 커스텀 배경은 Vercel Blob 연결 시 Blob URL로 저장한다. Blob 미연결 로컬 개발에서는 작은 Product Visual 스크린샷만 data URL로 fallback하고, 커스텀 배경은 로컬 filesystem에 저장한다. |
| 이탈 방지 | 저장하지 않은 변경사항이 있으면 홈 이동 전 확인 |

## 8. 생성/추천 요구사항

| 영역 | 내용 |
|---|---|
| 외부 LLM | 보안 정책상 금지 |
| 외부 네트워크 | Pexels 검색/이미지 CDN만 허용 |
| Chat UI | 프롬프트를 로컬 프리셋 대화 블록 배열로 변환 |
| Infographic | 붙여넣은 기사/텍스트/데이터에서 규칙 기반 시각화 후보 추천 |
| 안전장치 | 로컬 생성 결과도 validator로 스키마 검증 |
| 편집 제한 | 추천/수동 입력 결과가 블록 상한을 넘으면 에디터와 렌더러에서 같은 기준으로 제한 |
| 실패 처리 | 사용 가능한 결과가 없으면 텍스트/데이터 보강 안내 |

## 9. 성공 기준

| 지표 | 기준 |
|---|---|
| 제작 속도 | 기본 이미지 1개를 5분 이내 제작 |
| 재사용성 | 저장한 에셋을 다시 열어 수정 가능 |
| Export 품질 | PNG가 지정 사이즈와 @2x 해상도로 생성 |
| 안정성 | 외부 LLM/API 키 없이도 핵심 UI 검증 가능 |
| 확장성 | 새 템플릿/블록 추가 시 registry와 타입 중심으로 확장 가능 |

## 10. 비범위

- 실시간 협업
- 사용자별 권한/역할 관리
- 서버 DB 기반 에셋 관리
- Figma 편집 기능 대체
- AI 결과의 사실 정확성 보장
- 공개 SaaS 형태의 외부 사용자 온보딩

## 11. 우선순위

| 우선순위 | 항목 |
|---|---|
| P0 | Chat UI, Infographic, Product Visual 편집/저장/export 안정화 |
| P0 | 로컬 생성 route와 validator 검증 |
| P0 | 업로드 이미지 크기/형식 검증 |
| P1 | 배포 접근 제어 강화 |
| P2 | DB 기반 사용자별 에셋 목록/권한/협업 저장 |
| P2 | Clerk 등 사용자 인증 도입 |

## 12. 리스크

| 리스크 | 대응 |
|---|---|
| localStorage 용량 한계 | 업로드 이미지는 Blob URL 우선 저장, 큰 스크린샷/썸네일 저장 최소화, 저장 에셋/커스텀 배경 개수 제한, Vercel Blob 클라우드 스냅샷 병행. 3.5MB 초과 스냅샷은 클라우드 동기화를 건너뛰고 로컬 백업만 유지 |
| 저장 데이터 구조 변경 | `schemaVersion` 증가와 마이그레이션 함수 추가를 필수 변경 절차로 둔다 |
| 로컬 생성 품질 한계 | 프리셋/규칙 registry와 validator 유지 |
| Pexels 이미지 CORS | Pexels-only same-origin proxy와 export 전 이미지 inline 처리 |
| URL import 미지원 | 본문/데이터/source guidance 붙여넣기로 처리 |
| 운영 인증 약함 | 배포 전 Vercel protection 또는 정식 인증 도입 |

## 13. 관련 문서

- 개발 설계: `DEVELOPMENT_DESIGN.md`
- 에디터 UI 디자인 규칙: `STUDIO_DESIGN.md`
- 생성 에셋 디자인 규칙: `ASSET_DESIGN.md`
- 보호된 URL import 가이드: `docs/source-import-access.md`
