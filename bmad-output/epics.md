# Epics — DevNote AI

> The epic MAP. A thin index, not a context object. Story detail lives in the individual
> `{epic}.{story}.{slug}.story.md` files under `bmad-output/stories/`.
>
> Track: BMad Method
> Sources: prd.md, architecture.md

---

## Epic 1: Foundation & Project Setup

**Goal:** Next.js 단일 풀스택 프로젝트를 초기화하고, DB/인증/공통 유틸 등 다른 모든 에픽이
의존하는 기반을 구축한다. (PRD의 FR에 직접 대응하지는 않지만 architecture.md의 ADR-001,
ADR-002, ADR-003, ADR-005를 실행 가능한 상태로 만드는 필수 선행 에픽)

**In scope (cited):**
- ADR-001 Next.js 단일 풀스택 프로젝트 구조 [Source: architecture.md#adr-001-nextjs-단일-풀스택-애플리케이션]
- ADR-002 Prisma 스키마 + Neon 연결 [Source: architecture.md#adr-002-postgresqlneon--prisma-orm]
- ADR-003 Auth.js GitHub OAuth 설정 (FR-001, NFR-002 기반 마련) [Source: architecture.md#adr-003-github-oauth-via-authjs-jwt-세션]
- ADR-005 공통 API 응답 엔벨로프 [Source: architecture.md#adr-005-rest--json-응답-엔벨로프-규약]

**Architecture touchpoints:** 전체 프로젝트 골격, `lib/db`, `lib/auth.ts`, `prisma/schema.prisma`
[Source: architecture.md#4-component-design]

**Out of scope:** 도메인별 비즈니스 로직(분석/노트/블로그) — 각 해당 에픽에서 구현

**Stories (ordered):**

| ID | Slug | Intent | Status |
|------|------|--------|--------|
| 1.1 | nextjs-project-init | Next.js(App Router) 프로젝트 초기화 및 Vercel 배포 연결 | done |
| 1.2 | prisma-neon-setup | Prisma 스키마(User/AnalysisJob/Note/BlogDraft) 정의 + Neon 연결 + 마이그레이션 | done |
| 1.3 | authjs-github-oauth-setup | Auth.js 설정: GitHub Provider, Prisma Adapter, JWT 세션, github_token 암호화 저장 | done |
| 1.4 | common-api-envelope-authguard | 공통 API 응답 엔벨로프 유틸 + 인증 가드(auth 세션 체크) 헬퍼 | done |

**Cross-epic dependencies:**
- Blocked by: 없음 (최초 에픽)
- Blocks: Epic 2, 3, 4, 5 전체 (모든 에픽이 DB/인증/API 유틸에 의존)

---

## Epic 2: 인증 & 사용자 관리

**Goal:** 사용자가 GitHub 계정으로 로그인/로그아웃하고 자신의 프로필을 관리할 수 있다.

**In scope (cited):**
- FR-001 GitHub OAuth2 로그인 [Source: prd.md#fr-001-github-oauth2-로그인--must]
- FR-003 로그아웃 [Source: prd.md#fr-003-로그아웃--must]
- FR-004 내 정보 조회/수정 [Source: prd.md#fr-004-내-정보-조회수정--should]
- FR-005 회원 탈퇴 [Source: prd.md#fr-005-회원-탈퇴--could]

**Architecture touchpoints:** `auth/user` 컴포넌트, `/api/users/me`, Auth.js 라우트
[Source: architecture.md#component-auth/user]

**Out of scope:** FR-002(Access Token 재발급)는 Auth.js 세션 갱신으로 자동 처리되어 별도
스토리 없음 (Epic 1.3에서 이미 구성됨) [Source: architecture.md#adr-003-github-oauth-via-authjs-jwt-세션]

**Stories (ordered):**

| ID | Slug | Intent | Status |
|------|------|--------|--------|
| 2.1 | login-logout-flow-ui | 로그인/로그아웃 UI 플로우 (GitHub 로그인 버튼, 로그인 후 리다이렉트, 로그아웃) | done |
| 2.2 | user-profile-api-ui | 내 정보 조회/수정 API + 프로필 화면 | done |
| 2.3 | account-deletion | 회원 탈퇴 API + UI | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1 (Auth.js 설정, DB 스키마)
- Blocks: Epic 3 (분석 Job은 로그인 사용자 기준)

---

## Epic 3: Repo 분석 (커밋/PR 포함)

**Goal:** 사용자가 GitHub repo URL(+ 선택적 브랜치)을 입력하면 README/디렉토리/커밋/PR을 비동기로
분석하고 진행 상태를 확인할 수 있다.

**In scope (cited):**
- FR-006 분석 Job 생성 [Source: prd.md#fr-006-repo-분석-요청--must]
- FR-007 README+디렉토리 분석 [Source: prd.md#fr-007-readme--디렉토리-구조-분석--must]
- FR-008 브랜치 커밋 메시지 분석 (신규) [Source: prd.md#fr-008-브랜치-커밋-메시지-분석--must-신규]
- FR-009 브랜치 PR 분석 (신규) [Source: prd.md#fr-009-브랜치-pr-분석--must-신규]
- FR-010 분석 상태 조회 (폴링) [Source: prd.md#fr-010-분석-상태-조회-폴링--must]
- FR-011 내 분석 목록 조회 [Source: prd.md#fr-011-내-분석-목록-조회--should]
- FR-012 동일 커밋 기준 캐시 재사용 [Source: prd.md#fr-012-동일-커밋-기준-캐시-재사용--should]
- NFR-003 분석 Job 실패 처리 [Source: prd.md#nfr-003-분석-job-실패-처리--must-reliability]

**Architecture touchpoints:** `analysis` 컴포넌트, ADR-007(Fluid Compute `waitUntil`),
ADR-009(수집 범위 제한/캐싱) [Source: architecture.md#component-analysis-job-파이프라인]

**Out of scope:** 다중 브랜치 비교 분석 (DEF-001, addendum.md 참고)

**Stories (ordered):**

| ID | Slug | Intent | Status |
|------|------|--------|--------|
| 3.1 | analysis-request-api | 분석 Job 생성 API (POST /api/analysis, PENDING 상태 생성) | done |
| 3.2 | github-data-collector | GitHub 데이터 수집 클라이언트 (README+디렉토리+커밋 최신 50개+PR 최근 20개) | done |
| 3.3 | analysis-job-pipeline | Job 처리 파이프라인 (waitUntil, 상태 전이 PROCESSING→COMPLETED/FAILED, 커밋 SHA 캐싱) | done |
| 3.4 | analysis-status-polling | 분석 상태 조회 API + 폴링 UI (TanStack Query) | done |
| 3.5 | analysis-list-api-ui | 내 분석 목록 조회 API + 목록 화면 | done |
| 3.6 | analysis-request-ui | repo URL/브랜치 입력 폼 UI | done |

**Cross-epic dependencies:**
- Blocked by: Epic 1 (DB/인증), Epic 2 (로그인된 사용자 필요), **4.1과 5.1(스토리 3.3이 호출하는
  AI 노트/블로그 생성 함수 — 에픽 번호와 무관하게 3.3보다 먼저 구현되어야 함)**
- Blocks: Epic 4 (노트 생성은 분석 완료 이후)

---

## Epic 4: 학습 노트

**Goal:** 분석 완료 시 AI가 생성한 학습 노트를 사용자가 조회/삭제하며 학습 기록으로 활용할 수 있다.

**In scope (cited):**
- FR-013 AI 학습 노트 생성 [Source: prd.md#fr-013-ai-학습-노트-생성--must]
- FR-014 노트 목록 조회 [Source: prd.md#fr-014-노트-목록-조회--must]
- FR-015 노트 상세 조회 [Source: prd.md#fr-015-노트-상세-조회--must]
- FR-016 노트 삭제 [Source: prd.md#fr-016-노트-삭제--should]

**Architecture touchpoints:** `note` 컴포넌트 [Source: architecture.md#component-note]

**Out of scope:** 퀴즈/복습 관리 (DEF-002, addendum.md 참고)

**Stories (ordered):**

| ID | Slug | Intent | Status |
|------|------|--------|--------|
| 4.1 | ai-note-generation | AI 학습 노트 생성 로직 (OpenAI 프롬프트, Job 파이프라인 연동) | done |
| 4.2 | note-list-detail-api-ui | 노트 목록/상세 조회 API + 화면 | ready-for-dev |
| 4.3 | note-deletion | 노트 삭제 API + UI (연관 블로그 초안 연쇄 삭제) | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: Epic 3(3.1/3.2, 사용자 흐름상), 단 **4.1 자체는 1.2(Note 스키마)만 있으면 3.3보다
  먼저 구현 가능** — 3.3이 4.1을 호출하므로 오히려 4.1이 3.3의 선행 스토리다.
- Blocks: Epic 5 (블로그 초안은 노트 기반), 3.3(파이프라인이 4.1을 호출)

---

## Epic 5: 블로그 초안 & Export

**Goal:** 사용자가 노트 기반 블로그 초안을 확인하고 Markdown으로 내려받아 수동 발행할 수 있다.

**In scope (cited):**
- FR-017 블로그 초안 생성 [Source: prd.md#fr-017-블로그-초안-생성--must]
- FR-018 블로그 초안 조회 [Source: prd.md#fr-018-블로그-초안-조회--must]
- FR-019 블로그 초안 Markdown export [Source: prd.md#fr-019-블로그-초안-markdown-export--must]

**Architecture touchpoints:** `blog` 컴포넌트, ADR-008(DB 저장 + 다운로드 라우트)
[Source: architecture.md#component-blog]

**Out of scope:** 외부 플랫폼 자동 발행 (FR-020, Won't)

**Stories (ordered):**

| ID | Slug | Intent | Status |
|------|------|--------|--------|
| 5.1 | ai-blogdraft-generation | AI 블로그 초안 생성 로직 (노트 생성 파이프라인과 연동) | done |
| 5.2 | blogdraft-view-api-ui | 블로그 초안 조회 API + 화면 | ready-for-dev |
| 5.3 | blogdraft-markdown-export | Markdown export 다운로드 라우트 (DB content 스트리밍) | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: 4.1(Note 데이터 구조), 1.2(BlogDraft 스키마) — **5.1 자체는 3.3보다 먼저 구현
  가능/필요** (3.3이 5.1을 호출). 5.2/5.3은 4.2/4.3(노트 상세 페이지)에도 의존.
- Blocks: 없음 (마지막 에픽), 단 5.1은 3.3의 선행 스토리

---

## Branching Convention

모든 스토리는 `develop`을 base로 하는 개별 브랜치에서 작업한다 (기존 저장소의 `feature/xxx`
네이밍 컨벤션 계승). 각 스토리 파일 헤더의 `**Branch:**` 필드가 정본이며, 아래는 요약이다.

- **네이밍:** `feature/{epic}.{story}-{slug}`
- **Base:** `develop` — 스토리를 시작할 때마다 그 시점의 `develop` 최신 상태에서 새 브랜치를
  생성한다. 완료된 스토리는 리뷰 후 `develop`으로 머지하고, 다음 스토리는 머지된 `develop`을
  기준으로 다시 분기한다 (Dependency Maps의 Blocked-by 순서를 따름).
- **병렬 진행 시:** Owned Scope가 겹치지 않고 Blocked-by 관계가 없는 스토리끼리만 동시에
  `develop`에서 분기해 병렬로 작업한다 (예: 3.1↔3.2, 4.1/5.1↔Epic 2).

| Epic | Story | Branch |
|------|-------|--------|
| 1 | 1.1 | `feature/1.1-nextjs-project-init` |
| 1 | 1.2 | `feature/1.2-prisma-neon-setup` |
| 1 | 1.3 | `feature/1.3-authjs-github-oauth-setup` |
| 1 | 1.4 | `feature/1.4-common-api-envelope-authguard` |
| 2 | 2.1 | `feature/2.1-login-logout-flow-ui` |
| 2 | 2.2 | `feature/2.2-user-profile-api-ui` |
| 2 | 2.3 | `feature/2.3-account-deletion` |
| 3 | 3.1 | `feature/3.1-analysis-request-api` |
| 3 | 3.2 | `feature/3.2-github-data-collector` |
| 3 | 3.3 | `feature/3.3-analysis-job-pipeline` |
| 3 | 3.4 | `feature/3.4-analysis-status-polling` |
| 3 | 3.5 | `feature/3.5-analysis-list-api-ui` |
| 3 | 3.6 | `feature/3.6-analysis-request-ui` |
| 4 | 4.1 | `feature/4.1-ai-note-generation` |
| 4 | 4.2 | `feature/4.2-note-list-detail-api-ui` |
| 4 | 4.3 | `feature/4.3-note-deletion` |
| 5 | 5.1 | `feature/5.1-ai-blogdraft-generation` |
| 5 | 5.2 | `feature/5.2-blogdraft-view-api-ui` |
| 5 | 5.3 | `feature/5.3-blogdraft-markdown-export` |

---

## Delivery Tracking (count-based)

No story points, velocity, or burndown. Track by COUNT only:

- Total stories: 19
- Done: 0
- Ready for dev: 19 (전체)
- Remaining: 19
- Completion rate: 0%

## Notes

- 에픽 그룹핑(1→2→3→4→5)은 **가치 전달 관점**의 그룹핑이며, 실제 **빌드 순서는 에픽 번호와
  다르다.** 3.3(분석 Job 파이프라인)이 4.1(AI 노트 생성)과 5.1(AI 블로그 초안 생성) 함수를
  호출하므로, 실제 구현 순서는 대략: `1.1→1.2→1.3→1.4` → `2.1→2.2→2.3` → `3.1,3.2` →
  `4.1` → `5.1` → `3.3` → `3.4,3.5,3.6` → `4.2,4.3` → `5.2,5.3`. 각 스토리의 Dependency
  Maps(Blocked by/Blocks)가 실제 실행 순서의 단일 진실 공급원이며, 이 표는 참고용 요약이다.
- 병렬성은 같은 "빌드 단계" 안에서 Dependency Maps가 겹치지 않는 스토리 사이에서 나온다 (예:
  3.1과 3.2는 서로 독립적으로 병렬 진행 가능).
- FR-002(Access Token 재발급)는 별도 스토리가 없다 — Auth.js가 세션 갱신을 자동 처리하기로
  결정했기 때문 (ADR-003). FR-020(자동 발행)은 Won't로 스토리 없음.
- 전체 19개 스토리가 컴파일되어 `ready-for-dev` 상태이며, `scope-conflict-check.sh` 실행 결과
  16건의 파일 경로 충돌이 발견되었으나 전부 Dependency Maps의 Blocked-by 체인으로 이미
  직렬화되어 있음을 확인했다 (decision-log.md 참고).
