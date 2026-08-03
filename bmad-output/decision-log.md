# Decision Log — DevNote AI

A threaded, append-only record of decisions made across BMAD planning workflows.
Every later skill (brief, PRD, architecture, stories) appends here so the reasoning
behind the plan stays visible and consistent.

**How to use:** add a new entry at the top of the log (newest first). Never rewrite
or delete past entries — supersede them with a new entry that references the old one.

## Entry format

```
### YYYY-MM-DD — <short title>
- **Decision:** <what was decided>
- **Rationale:** <why; alternatives considered>
- **Made by:** <skill/workflow, e.g. bmad-init, prd, architecture>
- **Supersedes:** <link to prior entry, if any>
```

---

### 2026-08-03 — 스토리별 브랜치 네이밍 확정
- **Decision:** 19개 스토리 전체에 `**Branch:** feature/{epic}.{story}-{slug}` 필드를 추가하고,
  모두 `develop`을 base로 분기하도록 확정했다. 완료된 스토리는 리뷰 후 `develop`으로 머지하고,
  다음 스토리는 그 시점의 최신 `develop`에서 다시 분기한다. `epics.md`에 브랜치 요약 테이블과
  컨벤션 설명을 추가했다.
- **Rationale:** 기존 저장소가 이미 `feature/xxx` 네이밍 컨벤션을 사용 중이라 계승. 스토리
  단위 브랜치는 Owned File/Module Scope 설계와 맞물려 순차/병렬 실행 모두에서 충돌 없는 리뷰·
  머지 단위가 된다 (사용자가 순차 진행을 우선하되 일부 구간에서 병렬 진행을 고려 중).
- **Made by:** bmad-epics-and-stories
- **Supersedes:** none

### 2026-08-03 — Epic 2~5 스토리 15건 컴파일 완료, 전체 19개 스토리 ready-for-dev
- **Decision:** Epic 2(3개)~Epic 5(3개), 총 15개 스토리를 마저 컴파일해 전체 19개 스토리가
  모두 `ready-for-dev` 상태가 되었다. 개발 착수 전에 전체 백로그를 한 번에 검토하기로 사용자와
  합의.
  핵심 발견: **3.3(분석 Job 파이프라인)이 4.1(AI 노트 생성)과 5.1(AI 블로그 초안 생성) 함수를
  호출**해야 하므로, 실제 빌드 순서는 에픽 번호 순서(1→2→3→4→5)와 다르다 — 4.1과 5.1은 3.3보다
  먼저 구현되어야 한다. epics.md의 "가치 전달 관점 그룹핑"과 "실제 빌드 순서"를 분리해서
  명시했고, 각 스토리의 Dependency Maps(특히 3.3, 4.1, 5.1)에 Cross-epic dependency notice를
  추가했다.
  `scope-conflict-check.sh` 실행 결과 16건의 실제 경로 충돌(package.json, prisma/schema.prisma,
  app/api/analysis/route.ts, lib/domain/note/note-service.ts 등)이 발견되었으며, 모두 검토 결과
  Dependency Maps의 Blocked-by 체인으로 이미 직렬화되어 있어 문제 없음을 확인했다. 검사 과정에서
  스토리 파일의 "Shared/contended" 설명 불릿이 체커의 파싱 방식(불릿의 첫 토큰만 경로로 인식)과
  맞지 않아 오탐(placeholder 텍스트 자체가 경로로 인식됨)이 다수 발생했음을 발견 — 모든 스토리
  파일에서 실제 경로가 불릿의 첫 토큰이 되도록 형식을 수정해 오탐을 제거했다 (플러그인 스크립트
  자체는 수정하지 않음, "Do not copy or reimplement it" 원칙 준수).
- **Rationale:** 사용자가 "한번에 다 확인한 다음에 개발을 진행하자"고 요청. 크로스 에픽 의존성을
  숨기지 않고 명시적으로 문서화하는 것이 실제 개발 도구가 잘못된 순서로 작업을 시작해 막히는
  것을 방지하는 데 중요하다고 판단.
- **Made by:** bmad-epics-and-stories
- **Supersedes:** none

### 2026-08-03 — epics.md 작성 + Epic 1(Foundation) 스토리 4건 ready-for-dev
- **Decision:** `bmad-output/epics.md` 작성 완료 (5개 에픽, 19개 스토리). PRD의 4개 EPIC에
  architecture.md 기반 "Epic 1: Foundation & Project Setup"을 추가해 Next.js/Prisma/Auth.js
  초기 세팅을 선행 에픽으로 분리했다. FR-002(토큰 재발급)는 Auth.js가 대체하므로 별도 스토리
  없음.
  Epic 1의 4개 스토리(1.1 nextjs-project-init, 1.2 prisma-neon-setup, 1.3
  authjs-github-oauth-setup, 1.4 common-api-envelope-authguard)를 컨텍스트 오브젝트로 컴파일해
  `bmad-output/stories/`에 작성했다. scope-conflict-check.sh 실행 결과 `package.json`
  (1.1↔1.2, 1.1↔1.3), `prisma/schema.prisma`(1.2↔1.3) 충돌이 감지되었으나, 모두 Dependency
  Maps의 Blocked-by 체인(1.1→1.2→1.3→1.4)으로 이미 직렬화되어 있어 의도된 것으로 판단하고 4개
  스토리 모두 `ready-for-dev`로 전환했다.
- **Rationale:** 스토리 규모가 커서(19개) 한 번에 전부 컴파일하지 않고 Epic 1부터 순차 컴파일
  하기로 사용자와 합의. Epic 1은 원래 선형 의존 체인이라 병렬 실행 대상이 아니므로 scope 충돌이
  문제가 되지 않음.
- **Made by:** bmad-epics-and-stories
- **Supersedes:** none

### 2026-08-03 — Architecture 작성 완료 (9개 ADR)
- **Decision:** `bmad-output/architecture.md` 작성 및 검증 완료 (30/30). 핵심 결정:
  - ADR-001: Next.js 단일 풀스택(프런트+백엔드 통합), NestJS 분리 안은 기각
  - ADR-002: PostgreSQL(Neon, 무료 서버리스) + Prisma. Supabase 대비 Auth/Storage 미사용이라
    더 단순한 Neon 선택
  - ADR-003: Auth.js(NextAuth) GitHub OAuth + JWT 세션. 기존 커스텀 Access/Refresh Token
    엔드포인트(FR-002/003)는 Auth.js 세션 갱신/signOut으로 대체 구현
  - ADR-007: Vercel Fluid Compute(무료 티어에서 함수 실행 최대 300초)의 `waitUntil()`로 비동기
    분석 Job을 별도 큐/워커 서비스 없이 처리
  - ADR-008: 블로그 export는 S3 대신 DB에 저장된 Markdown을 다운로드 라우트로 직접 스트리밍
  - ADR-009: addendum Q1/Q3 해결 — 커밋 최신 50개, PR 최근 20개로 수집 범위 제한, 브랜치는
    사용자 지정 또는 default branch 자동 사용
- **Rationale:** 모든 결정이 NFR-001(무상 인프라)과 1인 개발 제약을 최우선으로 최적화됨. Neon vs
  Supabase는 웹서치로 2026년 최신 무료 티어를 확인 후 결정.
- **Made by:** bmad-architecture
- **Supersedes:** none

### 2026-08-03 — PRD 작성 완료
- **Decision:** `bmad-output/prd.md` 작성 완료 (20개 FR, 5개 NFR, 4개 에픽, MoSCoW 우선순위,
  추적 매트릭스 포함). 일일 분석 요청 한도(rate limiting)는 Must/Should/Could 어디에도 포함하지
  않고 Out of Scope로 확정. GitHub API rate limit에 대한 별도 엄격 대응 NFR도 이번 단계에서는
  제외 (기존 NFR-003의 일반적인 실패 처리로 충분).
- **Rationale:** 1인 전용 서비스라 요청량 자체가 낮아 rate limiting 인프라를 미리 구축할 필요가
  없다고 판단. 과도한 엔지니어링보다 핵심 흐름(로그인→분석→노트→블로그export) 완성이 우선.
- **Made by:** bmad-prd
- **Supersedes:** none

### 2026-08-03 — Product Brief 작성 완료
- **Decision:** `bmad-output/product-brief-devnote-ai-2026-08-03.md` 작성 및 검증 완료 (8/8 섹션,
  placeholder 없음). 대상 사용자는 본인 전용으로 한정, MVP는 발행 자동화 없이 Markdown export까지,
  퀴즈/복습 관리는 이번 스코프에서 제외(future scope 유지)로 확정.
- **Rationale:** 대화형 discovery를 통해 문제 정의(정리→발행 자동화 필요), 타깃(1인 전용),
  솔루션 범위(수동 발행), 성공 지표, 리스크를 확정. PRD 작성을 위한 기반 마련.
- **Made by:** bmad-product-brief
- **Supersedes:** none

### 2026-08-03 — Analysis 도메인 범위 확장: 브랜치 커밋/PR 분석 추가
- **Decision:** `analysis` 도메인의 GitHub 분석 파이프라인에 커밋 메시지 + PR 분석을 추가한다.
  README + 디렉토리 구조 분석을 **대체하지 않고 보완**하는 형태이며, 1차 범위는 사용자가
  지정한 **단일 브랜치(예: main)** 로 한정한다.
- **Rationale:** README/디렉토리 구조만으로는 실제 개발 과정(작업 흐름, 의사결정)이 드러나지
  않아 학습 노트 품질에 한계가 있음. 커밋 메시지/PR을 더하면 더 풍부한 노트 생성이 가능.
  여러 브랜치를 비교 분석하는 안은 GitHub API 호출량·복잡도가 커서 이번 스코프에서는 보류하고
  Non-Goals로 남김 (향후 확장 후보).
- **Made by:** bmad-init (product-brief/PRD 전 단계에서 사용자와 대화로 확정)
- **Supersedes:** none

### 2026-08-03 — Track selected: bmad-method
- **Decision:** Initialized this project on the **bmad-method** track.
- **Rationale:** 스코프는 풀스택 마이그레이션/재구축 전체(인증, 사용자, 분석 Job, 노트, 블로그
  5개 도메인 + 프런트엔드 재구축)로, 대략 15~30개 이상의 스토리가 예상됨. 1인 개발이고 엄격한
  보안/컴플라이언스 요구사항은 없음. 여러 도메인에 걸친 실질적인 제품 슬라이스이고 아키텍처
  전환(스택 선택, 배포 방식)에 대한 결정을 문서화할 필요가 있어 tech-spec만으로는 부족하다고
  판단 — PRD + Architecture가 필요한 BMad Method 트랙을 선택. Enterprise 트랙은 보안/DevOps
  플래닝까지 요구해 현재 범위에는 과함.
- **Made by:** bmad-init
- **Supersedes:** none
