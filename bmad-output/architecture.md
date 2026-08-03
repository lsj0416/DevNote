# System Architecture: DevNote AI

**Document Version:** 1.0
**Date:** 2026-08-03
**Author:** Winston (Architect)
**Track:** BMad Method
**Status:** Draft
**Source PRD:** `bmad-output/prd.md`

> This is the single source of truth for cross-cutting technical decisions. Every
> story compiled by bmad-scrum-master inherits the LOCKED decisions recorded here.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Pattern](#2-architecture-pattern)
3. [Architecture Decision Records](#3-architecture-decision-records)
4. [Component Design](#4-component-design)
5. [Data Model](#5-data-model)
6. [API Specifications](#6-api-specifications)
7. [FR / NFR Coverage Matrix](#7-fr--nfr-coverage-matrix)
8. [Technology Stack](#8-technology-stack)
9. [Trade-off Analysis](#9-trade-off-analysis)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Future Considerations](#11-future-considerations)

---

## 1. System Overview

### Purpose

GitHub repo URL을 입력하면 README, 디렉토리 구조, 지정 브랜치의 커밋 메시지·PR을 AI가 분석해
학습 노트와 블로그 초안(Markdown)을 생성하는 1인 전용 개인 도구. 무료/저비용 인프라만으로
운영 가능해야 한다.

### Scope

**In Scope:**
- GitHub OAuth 로그인, 비동기 repo 분석 Job, README+디렉토리+커밋/PR 분석, AI 학습 노트 생성,
  블로그 초안 생성 및 Markdown export

**Out of Scope:**
- 다중 브랜치 비교 분석, 퀴즈/복습 관리, 외부 플랫폼 자동 발행, rate limiting, 다중 사용자 확장
  (PRD Out of Scope 참고)

### Architectural Drivers

1. **NFR-001 (무상 인프라 운영)** — 모든 기술 선택이 무료 티어 내에서 동작해야 한다. 별도 상시
   구동 서버(EC2 등)나 유상 큐/워커 서비스를 배제하고, 서버리스 + scale-to-zero 조합으로 설계한다.
2. **NFR-003 (분석 Job 실패 처리)** — GitHub/OpenAI API 실패 시 안전하게 FAILED로 전이해야 하며,
   이는 서버리스 함수의 제한된 실행 시간과 결합해 설계되어야 한다.
3. **NFR-002 (GitHub Token 보안)** — GitHub access token 저장 방식에 암호화가 필요하다.
4. **1인 개발 (project-context.md)** — 운영 부담이 큰 멀티 서비스 토폴로지를 지양하고 단일
   배포 단위를 우선한다.

### Stakeholders & Constraints (from project-context.md)

- **Users:** 본인 1인 (개발자 겸 유일한 사용자)
- **Team:** 1인 개발, AI-Native 워크플로우로 빠른 구현 우선
- **Existing constraints:** AWS EC2/RDS/S3 등 유상 인프라 금지. GitHub REST API, OpenAI API
  외부 의존성 유지.

---

## 2. Architecture Pattern

**Pattern:** Serverless 모놀리스 (Next.js 단일 풀스택 애플리케이션)

**Justification:**
- 1인 개발 + 비용 0원 목표에서는 배포 단위를 하나로 유지하는 것이 운영 부담과 비용을 동시에
  최소화한다 (ADR-001).
- Vercel의 Fluid Compute(무료 티어에서 함수 실행시간 최대 300초)로 비동기 분석 Job을 별도
  큐/워커 서비스 없이 처리할 수 있어, 서비스 분리의 이점(독립 배포/스케일링)이 이번 스코프의
  트래픽(1인 사용자)에서는 비용/복잡도 대비 실익이 없다.

**Alternatives considered:**
- **Next.js(프런트) + NestJS(백엔드) 분리:** 배포본이 2개로 늘어나고, NestJS를 상시 구동하려면
  무료 티어가 마땅치 않음(Render 무료는 유휴 시 슬립, Railway는 유료화). Rejected.
- **전통 VM/컨테이너 상시 서버:** NFR-001(무상 인프라) 위반. Rejected.

**Application:** Next.js App Router 프로젝트 하나에 UI(React Server/Client Components)와 API
(Route Handlers)를 함께 두고, Vercel Hobby(무료) + Fluid Compute로 배포한다.

---

## 3. Architecture Decision Records

| ADR | Title | Status | Drives |
|-----|-------|--------|--------|
| ADR-001 | Next.js 단일 풀스택 애플리케이션 | Accepted | NFR-001, 1인 운영 제약 |
| ADR-002 | PostgreSQL(Neon) + Prisma ORM | Accepted | FR-013~019, NFR-001 |
| ADR-003 | GitHub OAuth via Auth.js, JWT 세션 | Accepted | FR-001, FR-002, FR-003, NFR-002 |
| ADR-004 | 서버 상태 우선 + TanStack Query 폴링 | Accepted | FR-010, FR-011 |
| ADR-005 | REST + JSON 응답 엔벨로프 규약 | Accepted | 전체 API |
| ADR-006 | 네이밍 컨벤션 (camelCase API / snake_case DB) | Accepted | 전체 API/DB |
| ADR-007 | Vercel Fluid Compute 기반 비동기 Job 처리 | Accepted | FR-006~010, NFR-001, NFR-003 |
| ADR-008 | Markdown export를 DB 저장 + 다운로드 라우트로 처리 (객체 스토리지 없음) | Accepted | FR-019, NFR-001 |
| ADR-009 | GitHub 커밋/PR 수집 범위 제한 및 캐싱 | Accepted | FR-008, FR-009, FR-012 |

---

### ADR-001: Next.js 단일 풀스택 애플리케이션

**Status:** Accepted   **Drives:** NFR-001, 1인 운영 제약

**Context:** 기존 시스템은 Spring Boot(백엔드) + React(프런트) + AWS(EC2/RDS/S3)로 분리되어
있었고, 이 인프라 비용이 재구축의 근본 동기다. 1인 개발이라 여러 배포본을 운영·모니터링할
여력이 부족하다.

**Decision:** 프런트엔드와 백엔드를 하나의 Next.js(App Router) 프로젝트로 통합한다. UI는 React
Server/Client Components로, API는 Next.js Route Handlers(`app/api/**/route.ts`)로 구현하며,
Vercel Hobby(무료) 플랜 + Fluid Compute로 단일 배포한다.

**Consequences — LOCKED for all stories:**
- 모든 API 엔드포인트는 Next.js Route Handler로 구현한다. 별도 백엔드 서비스/리포지토리를
  새로 만들지 않는다.
- **Easier:** 배포 1건, 환경변수 1세트, CORS 이슈 없음, 프리뷰 배포마다 풀스택 검증 가능.
- **Harder / accepted cost:** 백엔드 로직이 순수 도메인 계층(Java 시절의 레이어드 아키텍처)만큼
  물리적으로 분리되지 않음. **Mitigation:** `lib/domain/**` 아래에 도메인별(auth/analysis/note/
  blog) 순수 로직 모듈을 두고 Route Handler는 얇은 어댑터로만 사용 (ADR로 강제, 아래 컴포넌트
  설계 참고).

**Alternatives:** Next.js+NestJS 분리(위 2절 참고), Remix/SvelteKit 등 — Vercel 생태계 정합성과
팀(본인)의 기존 React 경험을 고려해 Next.js를 유지.

**Revisit when:** 사용자가 본인 외로 확장되어 트래픽/보안 요구가 커지거나, 백엔드 로직이 커져
독립 배포가 명확히 유리해질 때.

---

### ADR-002: PostgreSQL(Neon) + Prisma ORM

**Status:** Accepted   **Drives:** FR-013~019, NFR-001

**Context:** 기존 ERD(users, analysis_jobs, notes, blog_drafts)를 유지해야 하고, 관계형 데이터와
JSON 컬럼(concepts, learning_points)이 필요하다. 무료로 운영 가능한 관리형 DB가 필요하다.

**Decision:** Neon(Serverless PostgreSQL)을 1개 프로젝트로 사용하고, Prisma를 ORM으로 사용한다.
Vercel 서버리스 환경과의 호환을 위해 `@prisma/adapter-neon`(HTTP/WebSocket 기반 드라이버)을
사용한다.

**Consequences — LOCKED for all stories:**
- 모든 데이터 접근은 Prisma Client를 통해서만 이루어진다. Raw SQL은 예외적 성능 최적화가
  필요할 때만 허용.
- **Easier:** 스키마 마이그레이션(`prisma migrate`)과 타입 안전성 확보, Neon의 scale-to-zero로
  유휴 시 비용 0.
- **Harder / accepted cost:** Neon 무료 티어는 프로젝트당 0.5GB, 100 CU-hours/월 — 대용량
  데이터에는 부적합. **Mitigation:** 1인 사용자 트래픽 규모에서는 충분(학습 노트/블로그 텍스트
  중심, 미디어 파일 없음).

**Alternatives:** Supabase(내장 Auth/Storage 포함) — 이번 설계에서는 Auth.js(ADR-003)와 DB 저장
기반 export(ADR-008)를 쓰기로 해 Supabase의 부가 기능이 불필요, 더 단순한 Neon을 선택.

**Revisit when:** 0.5GB/100 CU-hours 한도에 근접하거나, 파일 스토리지가 실제로 필요해질 때
(Supabase 또는 Vercel Blob 재검토).

---

### ADR-003: GitHub OAuth via Auth.js, JWT 세션

**Status:** Accepted   **Drives:** FR-001, FR-002, FR-003, NFR-002

**Context:** 기존 시스템은 커스텀 JWT Access/Refresh Token 발급·재발급·무효화를 직접 구현했다
(별도 프런트-백엔드 분리 구조였기 때문). 단일 Next.js 앱으로 통합되면서(ADR-001) 프런트와 API가
같은 오리진에 있으므로, 세션을 HttpOnly 쿠키 기반으로 관리하는 것이 더 단순하고 안전하다.

**Decision:** Auth.js(NextAuth v5)의 GitHub Provider로 OAuth 로그인을 구현하고, JWT 세션 전략
(`session.strategy = "jwt"`)을 사용한다. GitHub OAuth `access_token`은 Auth.js `jwt` 콜백에서
받아 Prisma로 `users` 테이블에 암호화 후 저장한다(AES-256, 애플리케이션 레벨 암호화 유틸 사용).
세션 쿠키 자체가 Access/Refresh Token 역할을 대체하며, Auth.js가 세션 만료/갱신을 관리한다.

**Consequences — LOCKED for all stories:**
- 인증이 필요한 모든 Route Handler는 Auth.js의 `auth()` 헬퍼로 세션을 확인한다. 별도의 커스텀
  Bearer 토큰 검증 미들웨어를 만들지 않는다.
- FR-001(로그인)은 Auth.js GitHub Provider 플로우로, FR-002(재발급)는 Auth.js의 세션
  갱신(`updateAge`)으로, FR-003(로그아웃)은 Auth.js `signOut()`(세션 쿠키 무효화)으로 대체
  구현된다 — 커스텀 `/auth/refresh`, `/auth/logout` 엔드포인트는 만들지 않는다. **이는 PRD
  FR-001~003의 기능적 의도(로그인 유지/재인증/로그아웃)를 동일하게 충족하는 구현 방식 변경이다.**
- **Easier:** OAuth 플로우/토큰 관리 코드를 직접 작성하지 않아도 됨, CSRF 보호 내장.
- **Harder / accepted cost:** 세션이 쿠키에 묶여 별도 모바일 클라이언트 등에서 Bearer 토큰 재사용이
  어려움. **Mitigation:** 이번 스코프는 웹 전용 1인 사용자라 문제 없음. 필요 시 Auth.js의
  `session.strategy = "database"` 전환 또는 별도 API 토큰 발급 고려.
- GitHub `access_token` 저장 시 반드시 암호화한다 (NFR-002 LOCKED).

**Alternatives:** 커스텀 JWT Access/Refresh 구현 유지 — 단일 앱 구조에서는 불필요한 복잡도로 판단,
Rejected. Supabase Auth — DB 선택(ADR-002)과 상충, Rejected.

**Revisit when:** 비-브라우저 클라이언트(모바일 앱 등)가 추가되어 Bearer 토큰 기반 API 인증이
필요해질 때.

---

### ADR-004: 서버 상태 우선 + TanStack Query 폴링

**Status:** Accepted   **Drives:** FR-010, FR-011

**Context:** 분석 Job 상태 폴링(FR-010), 목록 조회(FR-011) 등 서버 상태를 다루는 화면이 대부분이며,
복잡한 클라이언트 전역 상태(장바구니류)는 없다.

**Decision:** 데이터 조회/폴링은 클라이언트 컴포넌트에서 TanStack Query(React Query)를 사용한다
(분석 상태는 `refetchInterval`로 폴링). 전역 클라이언트 상태 라이브러리(Redux/Zustand 등)는
도입하지 않는다. 정적/초기 렌더링은 가능한 한 Server Component에서 직접 Prisma를 호출해 처리한다.

**Consequences — LOCKED for all stories:**
- 클라이언트에서 서버 데이터를 다룰 때는 TanStack Query만 사용한다. 새로운 전역 상태 라이브러리를
  임의로 추가하지 않는다.
- **Easier:** 폴링/캐싱/재검증 로직을 직접 구현하지 않아도 됨.
- **Harder / accepted cost:** 복잡한 클라이언트 전역 상태가 필요해지면 재검토 필요. **Mitigation:**
  현재 스코프에는 해당 없음.

**Alternatives:** SWR — TanStack Query와 대동소이, 팀 친숙도상 특별한 우위 없어 임의로 TanStack
Query 선택.

**Revisit when:** 복잡한 클라이언트 전역 상태(예: 실시간 협업)가 필요해질 때.

---

### ADR-005: REST + JSON 응답 엔벨로프 규약

**Status:** Accepted   **Drives:** 전체 API

**Context:** 기존 시스템의 `ApiResponse<T>` 공통 응답 규약(success/data/message)이 이미 검증되어
있고, 새 스택에서도 클라이언트-서버 계약을 일관되게 유지해야 한다.

**Decision:** 모든 API는 REST 스타일 Route Handler로 구현하며, 응답은 다음 JSON 엔벨로프를
따른다:
- 성공: `{ "success": true, "data": <T>, "message": "OK" }`
- 실패: `{ "success": false, "message": "<설명>", "code": "<ERROR_CODE>" }`

HTTP 상태 코드는 기존 `docs/api.md`의 에러 코드 표(INVALID_REQUEST=400, UNAUTHORIZED=401,
FORBIDDEN=403, NOT_FOUND=404, DUPLICATE_REQUEST=409, GITHUB_API_ERROR/AI_API_ERROR=502,
INTERNAL_ERROR=500)를 그대로 계승한다 (RATE_LIMIT_EXCEEDED/429는 FR-013 삭제에 따라 제외).

**Consequences — LOCKED for all stories:**
- 모든 Route Handler는 위 엔벨로프 형태로만 응답한다. 임의의 커스텀 응답 형태를 만들지 않는다.
- **Easier:** 프런트엔드의 공통 fetch 래퍼 하나로 모든 API를 처리 가능.
- **Harder / accepted cost:** GraphQL 등 대비 오버페칭 가능성. **Mitigation:** 이번 스코프의
  데이터 크기가 작아 문제되지 않음.

**Alternatives:** GraphQL — 단일 사용자 스코프에서 과함, Rejected.

**Revisit when:** 다중 클라이언트(모바일 등)로 확장되어 유연한 쿼리가 필요해질 때.

---

### ADR-006: 네이밍 컨벤션 (Naming Convention) — camelCase API / snake_case DB casing

**Status:** Accepted   **Drives:** 전체 API/DB

**Context:** 기존 시스템이 camelCase JSON 응답 + snake_case DB 컬럼(JPA 관례)을 사용했다. 새
스택(Prisma)에서도 동일한 관례를 유지해 기존 문서(api.md, erd.md)와의 연속성을 확보한다.

**Decision:** API 요청/응답 JSON은 camelCase, DB 테이블/컬럼명은 snake_case(Prisma의 `@map`/
`@@map` 사용)로 매핑한다. REST 리소스 경로는 kebab-case 대신 소문자 복수형 명사를 그대로 사용
(`/api/analysis`, `/api/notes/{noteId}/blog-draft`).

**Consequences — LOCKED for all stories:**
- Prisma 스키마의 모든 필드는 camelCase로 정의하고 `@map("snake_case_column")`으로 DB 컬럼명을
  snake_case로 매핑한다.
- **Easier:** 기존 ERD/API 문서를 그대로 참고 가능, 리뷰 시 혼란 최소화.

**Alternatives:** 전체 camelCase(DB 포함) — Postgres 관례상 snake_case가 표준이라 유지.

**Revisit when:** 해당 없음 (안정적 컨벤션).

---

### ADR-007: Vercel Fluid Compute 기반 비동기 Job 처리

**Status:** Accepted   **Drives:** FR-006, FR-007, FR-008, FR-009, FR-010, NFR-001, NFR-003

**Context:** 분석 Job은 GitHub API(README/디렉토리/커밋/PR) 호출과 OpenAI API(노트+블로그 생성)
호출을 순차적으로 수행해야 하며, 합산 처리 시간이 수십 초에 달할 수 있다. 별도 큐/워커 서비스
(예: Upstash QStash, SQS)를 두면 무료 한도 관리 포인트가 늘고 구조가 복잡해진다.

**Decision:** `POST /api/analysis`는 `analysis_jobs` 레코드를 PENDING으로 생성한 뒤, Vercel의
`waitUntil()`을 사용해 같은 함수 실행 컨텍스트 안에서 분석 처리를 백그라운드로 계속하고 즉시
202 응답을 반환한다. 해당 Route Handler는 Fluid Compute를 활성화하고 `maxDuration`을 최대
300초로 설정한다. 클라이언트는 `GET /api/analysis/{jobId}` 폴링(ADR-004)으로 진행 상태를
확인한다.

**Consequences — LOCKED for all stories:**
- 분석 파이프라인(GitHub 수집 → AI 노트 생성 → AI 블로그 생성)은 하나의 Route Handler 내
  `waitUntil()` 콜백에서 순차 실행한다. 별도 큐/워커 서비스를 새로 도입하지 않는다.
- 각 외부 API 호출 단계는 실패 시 `analysis_jobs.status`를 FAILED로 전이하고 `error_message`를
  기록한다 (NFR-003 LOCKED).
- **Easier:** 인프라 구성요소가 늘지 않음(무료 티어 관리 포인트 최소화).
- **Harder / accepted cost:** 300초를 초과하는 극단적으로 큰 repo는 처리 실패 가능. **Mitigation:**
  ADR-009로 커밋/PR 수집 범위를 제한해 처리 시간을 예측 가능한 범위로 통제.

**Alternatives:** Upstash QStash(서버리스 큐, 무료 티어 500req/day) — 재시도/가시성은 좋아지지만
이번 스코프(1인, 저빈도 사용)에는 과한 복잡도. Rejected, 사용량이 늘면 재검토.

**Revisit when:** 분석 Job이 300초를 반복적으로 초과하거나, 재시도/가시성이 요구되는 사용 빈도로
늘어날 때 → Upstash QStash 등 큐 기반으로 전환.

---

### ADR-008: Markdown export를 DB 저장 + 다운로드 라우트로 처리

**Status:** Accepted   **Drives:** FR-019, NFR-001

**Context:** 기존 시스템은 블로그 초안 export 파일을 S3에 업로드했다. 이는 유상 인프라(AWS)라
NFR-001 위반이며, export 대상 파일(Markdown 텍스트)은 수 KB~수십 KB 수준으로 크지 않다.

**Decision:** 블로그 초안의 `content`(Markdown)는 이미 `blog_drafts` 테이블에 저장되어 있으므로,
"export"는 별도 객체 스토리지 업로드 없이 `GET /api/notes/{noteId}/blog-draft/export`가 해당
content를 `Content-Disposition: attachment` 헤더와 함께 `.md` 파일로 직접 스트리밍 응답한다.

**Consequences — LOCKED for all stories:**
- export 관련 스토리(FR-019)는 파일 업로드/스토리지 클라이언트를 구현하지 않는다. DB에 저장된
  content를 그대로 파일 응답으로 변환하는 로직만 구현한다.
- **Easier:** S3/Vercel Blob 등 추가 서비스 계정·비용 관리가 필요 없음.
- **Harder / accepted cost:** 영구 다운로드 URL(공유 가능한 링크)은 제공되지 않음 — 매번 인증된
  요청으로만 다운로드 가능. **Mitigation:** 1인 전용 도구이므로 공유 링크가 필요하지 않음
  (PRD Non-Goals: 외부 발행 자동화 제외와 일치).

**Alternatives:** Vercel Blob(무료 티어 있음) — 파일 크기가 작아 이점이 없어 Rejected, 필요 시
재검토.

**Revisit when:** export 파일에 이미지 등 바이너리 첨부가 필요해지거나, 공유 가능한 영구 URL이
요구될 때.

---

### ADR-009: GitHub 커밋/PR 수집 범위 제한 및 캐싱

**Status:** Accepted   **Drives:** FR-008, FR-009, FR-012, NFR-001 (addendum Q1, Q3 해결)

**Context:** PRD의 FR-008/FR-009(커밋/PR 분석)는 addendum에 "수집 범위(N)"와 "브랜치 지정 방식"을
아키텍처 단계에서 결정하도록 열어두었다. 범위를 제한하지 않으면 GitHub API 호출량·OpenAI 토큰
사용량이 커져 ADR-007의 300초 제한과 비용(NFR-001)에 위험이 된다.

**Decision:**
- 분석 대상 브랜치는 사용자가 요청 시 지정할 수 있으며, 지정하지 않으면 GitHub API로 조회한
  repo의 기본 브랜치(default branch)를 사용한다.
- 커밋 수집 범위는 지정 브랜치의 **최신 50개 커밋**으로 제한한다.
- PR 수집 범위는 지정 브랜치를 대상/소스로 하는 **최근 20개 PR**(열림+최근 병합 포함)로 제한한다.
- 캐싱(FR-012)은 기존 ERD의 `(repo_url, commit_sha)` 인덱스 전략을 그대로 유지한다 — 동일 repo +
  동일 최신 커밋 SHA로 재요청 시 기존 `notes` 레코드를 재사용하고 GitHub/OpenAI 재호출을 생략한다.

**Consequences — LOCKED for all stories:**
- GitHub API 클라이언트 구현은 커밋/PR 조회 시 반드시 50개/20개 상한을 적용한다 (페이지네이션
  파라미터로 강제).
- **Easier:** 처리 시간과 OpenAI 토큰 사용량이 예측 가능한 범위로 고정됨.
- **Harder / accepted cost:** 매우 활발한(50개 이상 커밋) repo는 오래된 커밋이 분석에서 누락됨.
  **Mitigation:** 학습 목적상 "최근 작업 흐름" 파악이 핵심이므로 최신 커밋 우선이 오히려 목적에
  부합. 필요 시 사용자가 범위를 수동 조정하는 기능은 향후 확장 후보(addendum DEF 항목 추가 대상).

**Alternatives:** 무제한 수집 — NFR-001/ADR-007 위반 위험, Rejected. 기간 기준(예: 최근 30일) —
브랜치별 커밋 빈도 편차가 커서 예측 가능성이 떨어짐, 개수 기준을 선택.

**Revisit when:** 사용자가 실제로 50개/20개 한도에 자주 걸리는 경험을 하게 될 때, 또는 다중 브랜치
비교 분석(DEF-001)이 도입될 때.

---

## 4. Component Design

### Component Overview

```
app/
├── (web)/                      # UI 라우트 (Server/Client Components)
├── api/
│   ├── auth/[...nextauth]/     # Auth.js 핸들러 (ADR-003)
│   ├── users/me/               # FR-004, FR-005
│   ├── analysis/               # FR-006, FR-010, FR-011
│   │   └── [jobId]/
│   ├── notes/                  # FR-014, FR-015, FR-016
│   │   └── [noteId]/
│   │       └── blog-draft/     # FR-017, FR-018
│   │           └── export/     # FR-019
lib/
├── domain/
│   ├── auth/                   # GitHub 사용자 upsert, 토큰 암호화
│   ├── analysis/                # Job 생성·처리 파이프라인 (ADR-007, ADR-009)
│   │   ├── github-client.ts    # README/디렉토리/커밋/PR 수집
│   │   └── job-processor.ts    # waitUntil 파이프라인
│   ├── note/                   # 노트 CRUD, AI 노트 생성 프롬프트
│   └── blog/                   # 블로그 초안 CRUD, export
├── db/                          # Prisma client 싱글턴
└── auth.ts                      # Auth.js 설정
```

### Component: analysis (Job 파이프라인)

**Responsibility:** repo 분석 요청을 받아 GitHub 데이터를 수집하고 AI 노트/블로그 생성까지
이어지는 비동기 파이프라인을 소유한다.
**Interfaces Provided:** `POST /api/analysis`, `GET /api/analysis`, `GET /api/analysis/{jobId}`
**Interfaces Required:** GitHub REST API, OpenAI API, `note` 컴포넌트(노트 생성 위임)
**Data Owned:** `analysis_jobs`
**ADRs that constrain it:** ADR-007, ADR-009
**NFRs Addressed:** NFR-001(Fluid Compute로 별도 인프라 없이 처리), NFR-003(실패 시 FAILED 전이)

### Component: note

**Responsibility:** AI가 생성한 학습 노트의 저장·조회·삭제를 소유한다. 도메인 간 원칙(기존
domain.md 계승): 다른 도메인은 note를 직접 Repository로 접근하지 않고 이 컴포넌트의 함수를
통해서만 접근한다.
**Interfaces Provided:** `GET /api/notes`, `GET /api/notes/{noteId}`, `DELETE /api/notes/{noteId}`,
내부 함수 `createNoteFromAnalysis()`
**Data Owned:** `notes`
**ADRs that constrain it:** ADR-002, ADR-005, ADR-006
**NFRs Addressed:** —

### Component: blog

**Responsibility:** 노트 기반 블로그 초안 생성·조회·export를 소유한다.
**Interfaces Provided:** `GET /api/notes/{noteId}/blog-draft`,
`POST /api/notes/{noteId}/blog-draft/export`
**Interfaces Required:** OpenAI API, `note` 컴포넌트
**Data Owned:** `blog_drafts`
**ADRs that constrain it:** ADR-008
**NFRs Addressed:** NFR-001(객체 스토리지 없이 export)

### Component: auth/user

**Responsibility:** GitHub OAuth 로그인·세션·사용자 프로필을 소유한다.
**Interfaces Provided:** Auth.js 라우트, `GET/PATCH/DELETE /api/users/me`
**Data Owned:** `users` (및 Auth.js Prisma adapter의 `accounts`/`sessions` 테이블)
**ADRs that constrain it:** ADR-003
**NFRs Addressed:** NFR-002(토큰 암호화)

---

## 5. Data Model

> Governed by ADR-002/ADR-006. 기존 ERD(`docs/erd.md`)를 계승하되 Auth.js 표준 테이블이 추가되고
> quizzes/review_schedules는 이번 스코프에서 제외한다 (PRD Out of Scope).

### Entity: User (`users`)

**Purpose:** GitHub OAuth 로그인 사용자 정보

**Attributes:**
- `id` (String/cuid, PK)
- `githubId` (String, unique) — `@map("github_id")`
- `username` (String) — `@map("username")`
- `email` (String?, nullable)
- `profileImage` (String?) — `@map("profile_image")`
- `githubToken` (String?, 암호화 저장) — `@map("github_token")` — ADR-003 LOCKED
- `createdAt` / `updatedAt` (DateTime)

**Relationships:** 1:N → AnalysisJob, 1:N → Note, 1:N → BlogDraft
**Indexes:** `githubId` unique
**Constraints:** —

### Entity: AnalysisJob (`analysis_jobs`)

**Purpose:** GitHub repo 분석 요청 Job 상태 관리

**Attributes:**
- `id` (String/cuid, PK)
- `userId` (String, FK → User)
- `repoUrl` (String) — `@map("repo_url")`
- `repoName` (String) — `@map("repo_name")`
- `branch` (String) — 분석 대상 브랜치 (사용자 지정 또는 default branch, ADR-009)
- `commitSha` (String?) — `@map("commit_sha")` — 캐싱 키 (FR-012)
- `status` (Enum: PENDING/PROCESSING/COMPLETED/FAILED)
- `errorMessage` (String?) — `@map("error_message")`
- `createdAt` / `updatedAt` (DateTime)

**Relationships:** N:1 → User, 1:1 → Note
**Indexes:** `userId`, `status`, `(repoUrl, commitSha)` (ADR-009 캐싱)
**Constraints:** —

### Entity: Note (`notes`)

**Purpose:** AI 생성 학습 노트 (구조화 데이터)

**Attributes:**
- `id` (String/cuid, PK)
- `userId` (String, FK → User)
- `jobId` (String, FK → AnalysisJob, unique)
- `title` (String)
- `summary` (String)
- `concepts` (Json) — 핵심 개념 배열
- `architecture` (String?) — Markdown
- `learningPoints` (Json) — `@map("learning_points")`
- `rawMarkdown` (String) — `@map("raw_markdown")`
- `createdAt` / `updatedAt` (DateTime)

**Relationships:** N:1 → User, 1:1 → AnalysisJob, 1:1 → BlogDraft
**Indexes:** `userId`, `jobId` unique

### Entity: BlogDraft (`blog_drafts`)

**Purpose:** 노트 기반 블로그 초안 (Markdown 본문 포함)

**Attributes:**
- `id` (String/cuid, PK)
- `userId` (String, FK → User)
- `noteId` (String, FK → Note, unique)
- `title` (String)
- `content` (String) — Markdown 본문, export의 소스 (ADR-008)
- `createdAt` / `updatedAt` (DateTime)

**Relationships:** N:1 → User, 1:1 → Note
**Indexes:** `noteId` unique

### Storage Strategy

- **Primary store:** PostgreSQL (Neon), ADR-002
- **Cache:** 별도 캐시 서버 없음 — `(repoUrl, commitSha)` DB 인덱스로 재분석 캐싱 처리 (ADR-009)
- **File/blob:** 없음 — Markdown export는 DB content를 직접 스트리밍 (ADR-008)
- **Retention / backup:** Neon 자체 PITR(Point-in-Time Recovery, 무료 티어 내 짧은 보존 기간)에
  의존. 별도 백업 자동화는 이번 스코프에서 구현하지 않음 (1인 데이터, 낮은 리스크로 판단).

---

## 6. API Specifications

> Governed by ADR-005(응답 규약), ADR-006(네이밍), ADR-003(인증)

**Protocol:** REST (ADR-005)   **AuthN:** Auth.js 세션 쿠키 (ADR-003)   **Versioning:** 없음
(단일 클라이언트, 필요 시 `/api/v2` 경로로 확장)

### `POST /api/analysis`
**Purpose:** repo 분석 Job 생성   **Auth:** Required

**Request:** `{ "repoUrl": string, "branch"?: string }`
**Response 202:** `{ "success": true, "data": { "jobId", "status": "PENDING", "repoUrl", "branch", "createdAt" }, "message": "OK" }`
**Error responses:** `INVALID_REQUEST`(400), `DUPLICATE_REQUEST`(409, 동일 repo 진행 중인 Job 존재 시)
**NFRs:** 응답은 Job 생성 즉시 반환 (분석 자체는 ADR-007 백그라운드 처리)

### `GET /api/analysis/{jobId}`
**Purpose:** 분석 상태 폴링   **Auth:** Required (본인 소유 Job만)

**Response:** `{ success, data: { jobId, status, repoUrl, noteId?, errorMessage? }, message }`
**Error responses:** `NOT_FOUND`(404), `FORBIDDEN`(403, 타인 소유 Job)

### `GET /api/analysis`
**Purpose:** 내 분석 목록   **Auth:** Required
**Request:** Query `page`, `size`
**Response:** 페이지네이션 리스트 (기존 api.md 형식 계승)

### `GET /api/notes`, `GET /api/notes/{noteId}`, `DELETE /api/notes/{noteId}`
**Purpose:** 노트 목록/상세/삭제   **Auth:** Required (본인 소유만)

### `GET /api/notes/{noteId}/blog-draft`
**Purpose:** 블로그 초안 조회   **Auth:** Required

### `POST /api/notes/{noteId}/blog-draft/export`
**Purpose:** Markdown 파일 다운로드   **Auth:** Required
**Response:** `Content-Type: text/markdown`, `Content-Disposition: attachment; filename="{slug}.md"`
(ADR-008 — JSON 엔벨로프가 아닌 파일 스트림 응답으로 예외 처리)

### `GET/PATCH/DELETE /api/users/me`
**Purpose:** 내 프로필 조회/수정/탈퇴   **Auth:** Required

### `/api/auth/[...nextauth]`
**Purpose:** Auth.js 표준 라우트 (로그인 시작, 콜백, 세션, 로그아웃) — FR-001/002/003을 대체
구현 (ADR-003)

---

## 7. FR / NFR Coverage Matrix

| ID | Type | Requirement | Component(s) | ADR(s) | Status |
|----|------|-------------|---------------|--------|--------|
| FR-001 | FR | GitHub OAuth2 로그인 | auth/user | ADR-003 | Addressed |
| FR-002 | FR | Access Token 재발급 | auth/user | ADR-003 | Addressed (Auth.js 세션 갱신으로 대체) |
| FR-003 | FR | 로그아웃 | auth/user | ADR-003 | Addressed (Auth.js signOut으로 대체) |
| FR-004 | FR | 내 정보 조회/수정 | auth/user | ADR-002, ADR-005 | Addressed |
| FR-005 | FR | 회원 탈퇴 | auth/user | ADR-002 | Addressed |
| FR-006 | FR | 분석 Job 생성 | analysis | ADR-007 | Addressed |
| FR-007 | FR | README+디렉토리 분석 | analysis | ADR-007 | Addressed |
| FR-008 | FR | 브랜치 커밋 분석 (신규) | analysis | ADR-007, ADR-009 | Addressed |
| FR-009 | FR | 브랜치 PR 분석 (신규) | analysis | ADR-007, ADR-009 | Addressed |
| FR-010 | FR | 분석 상태 조회 (폴링) | analysis | ADR-004, ADR-007 | Addressed |
| FR-011 | FR | 내 분석 목록 조회 | analysis | ADR-004 | Addressed |
| FR-012 | FR | 커밋 SHA 캐시 재사용 | analysis | ADR-009 | Addressed |
| FR-013 | FR | AI 학습 노트 생성 | analysis, note | ADR-007 | Addressed |
| FR-014 | FR | 노트 목록 조회 | note | ADR-002 | Addressed |
| FR-015 | FR | 노트 상세 조회 | note | ADR-002 | Addressed |
| FR-016 | FR | 노트 삭제 | note | ADR-002 | Addressed |
| FR-017 | FR | 블로그 초안 생성 | blog | ADR-002 | Addressed |
| FR-018 | FR | 블로그 초안 조회 | blog | ADR-002 | Addressed |
| FR-019 | FR | Markdown export | blog | ADR-008 | Addressed |
| FR-020 | FR | 외부 자동 발행 (Won't) | — | — | Deferred (PRD Out of Scope) |
| NFR-001 | NFR | 무상 인프라 운영 | 전체 | ADR-001, ADR-002, ADR-007, ADR-008 | Addressed |
| NFR-002 | NFR | GitHub Token 암호화 | auth/user | ADR-003 | Addressed |
| NFR-003 | NFR | 분석 Job 실패 처리 | analysis | ADR-007 | Addressed |
| NFR-004 | NFR | 분석 상태 확인성 | analysis | ADR-004 | Addressed |
| NFR-005 | NFR | 도메인 경계 유지 | 전체 | ADR-001 (Component Design) | Addressed |

### Detailed NFR notes (per driver)

- **NFR-001:** Vercel Hobby(무료) + Fluid Compute, Neon 무료 티어, DB 저장 기반 export(스토리지
  서비스 불필요) 조합으로 상시 유상 인프라 없이 운영. 매월 실제 청구 비용 확인으로 검증.
- **NFR-002 (Security — encryption at rest, authentication):** GitHub access token은 애플리케이션
  레벨 AES-256 암호화(encryption) 후 `users.github_token`에 저장. 복호화는 서버 사이드에서만
  수행. 인증(authentication)은 ADR-003의 Auth.js GitHub OAuth로, 인가(authorization)는 "본인
  소유 리소스만 접근 가능" 규칙(각 API에서 `userId` 일치 검증)으로 처리한다 — 별도 RBAC 불필요
  (1인 전용 서비스).
- **NFR-003:** `job-processor.ts`의 각 단계(GitHub 수집, AI 노트 생성, AI 블로그 생성)는
  try/catch로 감싸 실패 시 `status=FAILED` + `errorMessage` 기록. PENDING/PROCESSING 고착 방지.
- **NFR-005 (Maintainability — module boundaries, documentation):** Component Design(4절)의
  `lib/domain/**` 구조로 기존 domain.md 원칙(도메인 간 직접 Repository 접근 금지, Service 계층을
  통한 접근)을 계승해 module boundaries를 코드 레벨로 유지한다. 이 architecture.md 자체가 각
  도메인 컴포넌트의 documentation 역할을 겸한다.
- **Performance (참고, PRD에 별도 NFR 없음):** 이번 스코프는 1인 트래픽이라 엄격한 응답시간
  목표(response time / latency budget)를 두지 않는다. 다만 ADR-009의 caching(동일 repo+커밋
  SHA 재요청 시 재분석 생략)이 반복 요청의 체감 지연을 크게 줄여준다.

---

## 8. Technology Stack

| Layer | Choice | Version | Rationale (→ driver) | ADR |
|-------|--------|---------|------------------------|-----|
| Frontend | Next.js (App Router, React) | 15.x | 단일 배포로 프런트/백엔드 통합, Vercel 무료 티어 최적 | ADR-001 |
| Backend | Next.js Route Handlers | 15.x | 별도 백엔드 서비스 불필요 → NFR-001 | ADR-001 |
| ORM | Prisma | 6.x | 타입 안전 + Neon 서버리스 드라이버 어댑터 지원 | ADR-002 |
| Database | PostgreSQL (Neon) | 16 | 무료 티어 + scale-to-zero → NFR-001 | ADR-002 |
| Auth | Auth.js (NextAuth) + GitHub Provider | v5 | OAuth/세션 관리 자체 구현 불필요, 쿠키 기반 단순화 | ADR-003 |
| Client data fetching | TanStack Query | 5.x | 폴링/캐싱 표준화 | ADR-004 |
| AI | OpenAI API (GPT-4o, GPT-4o mini) | - | PRD 의존성 유지 (변경 없음) | - |
| GitHub 연동 | GitHub REST API (Octokit) | - | 기존 의존성 유지, 공식 SDK로 안정성 확보 | ADR-009 |
| 비동기 처리 | Vercel Fluid Compute (`waitUntil`) | - | 별도 큐/워커 없이 최대 300초 백그라운드 처리 → NFR-001 | ADR-007 |
| Infrastructure | Vercel (Hobby, 무료) | - | Next.js 네이티브 배포, 무료 티어 | ADR-001, ADR-007 |

**Alternatives considered:** NestJS 백엔드(Rejected, ADR-001), Supabase(Rejected, ADR-002/003),
Upstash QStash(Rejected 현재, ADR-007 Revisit 대상), S3/Vercel Blob(Rejected, ADR-008).

---

## 9. Trade-off Analysis

### Trade-off: 단일 앱 vs 서비스 분리

**Decision:** 단일 Next.js 앱 (ADR-001)

**Options:**
- 단일 앱: 배포/운영 단순, 무료 티어로 충분. 도메인 경계는 코드 레벨(폴더 구조)로만 유지.
- 서비스 분리(Next.js+NestJS): 물리적 경계가 명확하지만 배포·비용·운영 부담 2배.

**Rationale:** NFR-001(비용)과 1인 개발 제약이 압도적으로 단일 앱을 지지. 사용자 규모(1인)에서
서비스 분리의 이점(독립 스케일링)은 실익이 없음.

**Accepted:** Benefit 낮은 비용·운영 부담 / Cost 도메인 경계가 코드 컨벤션에 의존(강제 아님) /
Mitigation `lib/domain/**` 구조 + 코드 리뷰로 경계 유지.

**Revisit when:** 사용자 확장 또는 팀 확장 시.

### Trade-off: 비동기 처리 — 인앱 백그라운드 vs 외부 큐

**Decision:** Vercel Fluid Compute `waitUntil()` (ADR-007)

**Options:**
- 인앱 처리: 추가 서비스 없음, 300초 상한.
- 외부 큐(QStash 등): 재시도/가시성 우수하지만 복잡도·별도 무료 한도 관리 필요.

**Rationale:** 1인 저빈도 사용 트래픽에서는 300초 상한 + ADR-009 범위 제한으로 충분히 안전.

**Accepted:** Benefit 인프라 단순화 / Cost 재시도 로직 부재(실패 시 사용자가 재요청) / Mitigation
FAILED 상태와 에러 메시지로 재요청 유도.

**Revisit when:** 300초 초과가 반복되거나 재시도 자동화가 필요해질 때.

---

## 10. Deployment Architecture

### Environments

- **Development:** 로컬(`next dev`) + Neon 개발용 브랜치(Neon의 DB 브랜칭 기능 활용, 무료 티어
  포함).
- **Production:** Vercel Production 배포 (main 브랜치 push 시 자동 배포).
- 별도 Staging 환경은 1인 개발 규모상 생략 — Vercel의 PR Preview 배포로 대체.

### Topology

```
[ Browser ]
    │ HTTPS
[ Vercel Edge Network ]
    │
[ Next.js App (Vercel Functions, Fluid Compute) ]
    │            │              │
[ Neon Postgres ] [ GitHub API ] [ OpenAI API ]
```

### Strategy

- **Deployment method:** Vercel Git 연동 자동 배포 (main push → Production, PR → Preview).
- **Rollback:** Vercel 대시보드에서 이전 배포로 즉시 롤백 (Vercel 기본 기능).
- **Scaling:** Vercel Functions는 요청 단위 자동 스케일. DB는 Neon 무료 한도(0.5GB, 100
  CU-hours/월) 내에서 scale-to-zero로 비용 관리, 한도 근접 시 유료 전환 여부를 사용자가 직접 판단.
- **Availability / Monitoring:** 별도 SLA/uptime 목표는 두지 않는다 (1인 개인 도구). Vercel의
  기본 배포 상태 대시보드와 Neon의 DB 모니터링(monitoring) 화면으로 장애를 확인하는 수준으로
  충분하다고 판단 — 무료 티어에서 제공하는 것 이상의 별도 모니터링 인프라는 구축하지 않는다.

---

## 11. Future Considerations

**Anticipated changes:**
- 근시일: 커밋/PR 수집 상한(50/20) 조정, 브랜치 선택 UX 개선.
- 중기: DEF-001(다중 브랜치 비교), DEF-002(퀴즈/복습) 도입 시 새 ADR/컴포넌트 추가.
- 장기: 2차 사용자 확장 시 ADR-003(인증), NFR-001(무료 티어 한도) 전면 재검토 필요.

**Scalability path:** 현재 1인 트래픽 → Neon/Vercel 무료 한도 근접 시 각각 유료 티어로 개별
업그레이드(전체 재설계 불필요, ADR별 Revisit 조건 참고).

**Revisit triggers (aggregated from ADRs):**
- ADR-002: Neon 0.5GB/100 CU-hours 한도 근접
- ADR-003: 비-브라우저 클라이언트 추가
- ADR-007: 분석 Job이 300초를 반복 초과
- ADR-008: 바이너리 첨부/공유 URL 필요
- ADR-009: 50/20 커밋·PR 한도에 자주 도달

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| Fluid Compute | Vercel의 서버리스 함수 실행 모델. 인스턴스 재사용으로 무료 티어에서도 함수 실행시간을 최대 300초까지 확장 |
| Analysis Job | GitHub repo 분석 요청 단위 (PENDING→PROCESSING→COMPLETED/FAILED) |
| Note | AI가 생성한 학습 노트 |
| BlogDraft | Note 기반 블로그 초안 |

### References

- PRD: `bmad-output/prd.md`
- Decision log: `bmad-output/decision-log.md`
- Project context: `bmad-output/project-context.md`
- 기존 설계 문서(참고): `docs/architecture.md`, `docs/domain.md`, `docs/api.md`, `docs/erd.md`

### Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-03 | Winston (Architect) | Initial architecture |

---

**END OF DOCUMENT** — Ready for handoff to bmad-scrum-master once validation passes.
