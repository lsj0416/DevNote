# Product Requirements Document (PRD)

**Project Name:** DevNote AI
**Version:** 1.0
**Date:** 2026-08-03
**Author:** sejong (PM)
**Status:** Draft
**Track:** BMad Method

> Source of truth for *what* and *why*. It does not prescribe *how* (that is the architecture skill).
> Overflow / deferred detail lives in `addendum.md`. Decisions are logged in `decision-log.md`.

---

## Executive Summary

**Problem Statement:** 개발자가 GitHub repo를 학습할 때 README, 코드, 커밋/PR 흐름을 훑으며
"무엇을, 왜, 어떻게" 개발했는지 파악하고 정리하는 과정을 반복하지만, 이 정리가 매번 수작업이라
시간이 들고 블로그 발행까지 이어지지 못해 나중에 다시 찾아보거나 복습하기 어렵다.

**Proposed Solution:** GitHub repo URL을 입력하면 README + 디렉토리 구조 + 지정 브랜치의 커밋
메시지·PR 흐름을 AI가 분석해 학습 노트와 블로그 초안(Markdown)을 자동 생성한다. 발행은 사용자가
export된 Markdown으로 수동 진행한다.

**Business Value:** 본인이 실제 학습 루틴에 바로 써먹을 수 있는 도구를 AI-Native 방식으로 빠르게
완성하고, AWS 등 유상 인프라 없이 운영해 지속 가능한 개인 도구로 만든다.

**Target Outcome:** 3개월 내 repo 3~5건 분석 + 블로그 최소 1건 발행, 6개월 내 주 1회 이상 사용
습관화, AWS 비용 없이 운영 유지.

---

## Project Overview

### Background

기존 DevNote 서비스는 Spring Boot(Gradle) + React + AWS(EC2/RDS/S3)로 구현되어 있으며, GitHub
OAuth 로그인, repo 분석 Job(README+디렉토리 구조 기반), AI 학습 노트/블로그 초안 생성 기능을
갖추고 있다. 이번 재구축은 배포 비용 회피와 AI-Native 개발 속도를 목표로 풀스택을 다시 설계·
구현하며, 분석 범위에 커밋/PR 분석을 추가한다.

### Current State → Desired State

- **Current:** Spring Boot + React + AWS(EC2/RDS/S3) 기반. README+디렉토리 구조만 분석. 대상
  사용자는 다수를 염두에 둔 설계(포트폴리오 겸 실서비스 지향).
- **Desired:** 무료/저비용 인프라로 운영 가능한 풀스택. README+디렉토리 구조에 더해 지정 브랜치의
  커밋/PR 분석을 결합한 더 풍부한 노트 생성. 대상 사용자는 본인 전용으로 좁힘.

### Stakeholders

| Stakeholder | Role | Interest | Influence |
|-------------|------|----------|-----------|
| sejong (본인) | 기획/개발/사용자 | 학습 루틴에 바로 사용할 도구 확보 | 높음 (단독 의사결정) |

---

## Goals and Objectives

### Business Goals
1. AWS 등 유상 인프라 없이 운영 가능한 풀스택 서비스를 완성한다.
2. AI-Native 개발 방식으로 빠르게 구현해 바로 실사용을 시작한다.

### User Goals
1. GitHub repo를 학습할 때 README/커밋/PR 기반의 정리된 학습 노트를 자동으로 받는다.
2. 노트를 블로그 초안(Markdown)으로 받아 수동 발행까지 빠르게 이어간다.

---

## Functional Requirements

> Format: `FR-###: <PRIORITY> — <capability>`. IDs are immutable; never renumber — append new ones.

### FR-001: GitHub OAuth2 로그인 — MUST
**Description:** 사용자가 GitHub 계정으로 로그인하면 시스템은 GitHub 사용자 정보를 조회/생성하고
JWT Access Token과 Refresh Token을 발급한다.
**Acceptance Criteria:**
- GitHub 로그인 성공 시 신규 사용자는 자동으로 생성된다.
- 로그인 성공 시 Access Token과 Refresh Token이 발급된다.
- 기존 GitHub 계정으로 재로그인 시 기존 사용자 레코드가 재사용된다 (중복 생성 없음).
**Related Epic:** EPIC-001

---

### FR-002: Access Token 재발급 — MUST
**Description:** 유효한 Refresh Token으로 새로운 Access Token을 재발급한다.
**Acceptance Criteria:**
- 유효한 Refresh Token 제출 시 새 Access Token이 반환된다.
- 만료/무효한 Refresh Token 제출 시 401 오류가 반환된다.
**Related Epic:** EPIC-001

---

### FR-003: 로그아웃 — MUST
**Description:** 로그아웃 시 서버에 저장된 Refresh Token을 무효화한다.
**Acceptance Criteria:**
- 로그아웃 요청 시 해당 Refresh Token이 무효화되어 이후 재발급에 사용할 수 없다.
**Related Epic:** EPIC-001

---

### FR-004: 내 정보 조회/수정 — SHOULD
**Description:** 로그인한 사용자가 자신의 프로필 정보를 조회하고 username을 수정할 수 있다.
**Acceptance Criteria:**
- 인증된 사용자는 자신의 프로필(username, email, profileImage)을 조회할 수 있다.
- 사용자는 username을 변경할 수 있다.
**Related Epic:** EPIC-001

---

### FR-005: 회원 탈퇴 — COULD
**Description:** 사용자가 계정을 삭제할 수 있다.
**Acceptance Criteria:**
- 탈퇴 요청 시 사용자 계정과 관련 데이터가 삭제(또는 비활성화)된다.
**Related Epic:** EPIC-001

---

### FR-006: Repo 분석 요청 — MUST
**Description:** 사용자가 GitHub repo URL을 입력하면 시스템은 비동기 분석 Job을 생성한다.
**Acceptance Criteria:**
- 유효한 GitHub repo URL 입력 시 Job이 PENDING 상태로 생성된다.
- 유효하지 않은 URL 입력 시 오류가 반환되고 Job이 생성되지 않는다.
- Job 생성 응답에 jobId, status, repoUrl이 포함된다.
**Related Epic:** EPIC-002

---

### FR-007: README + 디렉토리 구조 분석 — MUST
**Description:** 분석 Job 처리 시 대상 repo의 README와 디렉토리 구조를 GitHub API로 수집해
분석 데이터로 사용한다.
**Acceptance Criteria:**
- README 내용과 최상위 디렉토리 구조가 수집된다.
- README가 없는 repo도 디렉토리 구조만으로 분석이 진행된다 (실패로 처리하지 않음).
**Related Epic:** EPIC-002

---

### FR-008: 브랜치 커밋 메시지 분석 — MUST (신규)
**Description:** 분석 Job 처리 시 사용자가 지정한(또는 기본값 main) 단일 브랜치의 커밋 메시지
이력을 GitHub API로 수집해 분석 데이터로 사용한다.
**Acceptance Criteria:**
- 지정 브랜치의 커밋 메시지 목록이 수집된다.
- 지정 브랜치가 존재하지 않으면 명확한 오류(FAILED 상태 + 에러 메시지)로 처리된다.
- 커밋 수가 많은 repo도 분석이 실패하지 않도록 최근 N개 등으로 범위가 제한된다 (구체적 N은
  아키텍처/구현 단계에서 결정).
**Related Epic:** EPIC-002

---

### FR-009: 브랜치 PR 분석 — MUST (신규)
**Description:** 분석 Job 처리 시 지정 브랜치와 연관된 PR 목록(제목, 설명, 상태)을 GitHub API로
수집해 분석 데이터로 사용한다.
**Acceptance Criteria:**
- 지정 브랜치로 병합되었거나 대상인 PR 목록이 수집된다.
- PR이 없는 repo도 분석이 실패하지 않고 README/디렉토리/커밋 데이터만으로 진행된다.
**Related Epic:** EPIC-002

---

### FR-010: 분석 상태 조회 (폴링) — MUST
**Description:** 사용자는 생성한 분석 Job의 상태(PENDING/PROCESSING/COMPLETED/FAILED)를 조회할
수 있다.
**Acceptance Criteria:**
- Job 상태가 PENDING, PROCESSING, COMPLETED, FAILED 중 하나로 정확히 반환된다.
- COMPLETED 상태일 때 생성된 noteId가 함께 반환된다.
- FAILED 상태일 때 errorMessage가 함께 반환된다.
**Related Epic:** EPIC-002

---

### FR-011: 내 분석 목록 조회 — SHOULD
**Description:** 사용자는 자신이 요청한 분석 Job 목록을 페이지네이션으로 조회할 수 있다.
**Acceptance Criteria:**
- 사용자 본인의 Job만 조회된다 (다른 사용자 Job은 노출되지 않는다).
- 페이지네이션(page, size)이 지원된다.
**Related Epic:** EPIC-002

---

### FR-012: 동일 커밋 기준 캐시 재사용 — SHOULD
**Description:** 동일 repo + 동일 커밋 SHA로 재요청 시 AI를 재호출하지 않고 기존 분석 결과를
재사용한다.
**Acceptance Criteria:**
- 동일 repo + 동일 커밋 SHA로 재요청 시 기존 노트가 반환되고 새 AI 호출이 발생하지 않는다.
- 새 커밋이 push된 이후 요청 시에는 새 Job이 생성되어 최신 분석이 수행된다.
**Related Epic:** EPIC-002

---

### FR-013: AI 학습 노트 생성 — MUST
**Description:** 분석 Job이 완료되면 시스템은 수집된 데이터(README, 디렉토리 구조, 커밋, PR)를
기반으로 AI가 학습 노트(요약, 핵심 개념, 아키텍처 설명, 학습 포인트)를 생성해 저장한다.
**Acceptance Criteria:**
- 노트에는 요약, 핵심 개념 목록, 아키텍처 설명, 학습 포인트 목록이 포함된다.
- 커밋/PR 데이터가 존재할 경우 노트 내용에 개발 흐름(작업 과정) 관련 설명이 반영된다.
- AI API 호출 실패 시 Job은 FAILED 상태로 전이되고 노트는 생성되지 않는다.
**Related Epic:** EPIC-003

---

### FR-014: 노트 목록 조회 — MUST
**Description:** 사용자는 자신이 생성한 학습 노트 목록을 페이지네이션으로 조회할 수 있다.
**Acceptance Criteria:**
- 사용자 본인의 노트만 조회된다.
- 목록에는 title, summary, createdAt이 포함된다.
**Related Epic:** EPIC-003

---

### FR-015: 노트 상세 조회 — MUST
**Description:** 사용자는 특정 노트의 상세 내용(요약, 핵심 개념, 아키텍처 설명, 학습 포인트,
원문 마크다운)을 조회할 수 있다.
**Acceptance Criteria:**
- 본인 소유 노트만 조회 가능하며, 타인의 노트 조회 시 403/404가 반환된다.
**Related Epic:** EPIC-003

---

### FR-016: 노트 삭제 — SHOULD
**Description:** 사용자는 자신의 노트를 삭제할 수 있다.
**Acceptance Criteria:**
- 노트 삭제 시 연관된 블로그 초안도 함께 삭제된다.
**Related Epic:** EPIC-003

---

### FR-017: 블로그 초안 생성 — MUST
**Description:** 노트 생성 시(또는 요청 시) 노트 내용을 기반으로 AI가 블로그 초안(제목, 본문)을
생성한다.
**Acceptance Criteria:**
- 블로그 초안은 노트 1건당 최대 1건 존재한다 (1:1 관계).
- 블로그 초안 생성 실패 시에도 노트는 정상적으로 유지된다 (블로그 생성은 노트 생성에 종속되되
  실패가 노트를 훼손하지 않는다).
**Related Epic:** EPIC-004

---

### FR-018: 블로그 초안 조회 — MUST
**Description:** 사용자는 노트에 연결된 블로그 초안을 조회할 수 있다.
**Acceptance Criteria:**
- 본인 소유 노트의 블로그 초안만 조회 가능하다.
**Related Epic:** EPIC-004

---

### FR-019: 블로그 초안 Markdown export — MUST
**Description:** 사용자는 블로그 초안을 `.md` 파일로 export하여 다운로드할 수 있다.
**Acceptance Criteria:**
- export 요청 시 다운로드 가능한 Markdown 파일(또는 URL)이 반환된다.
- export는 유상 인프라(예: S3) 없이도 동작해야 한다 (구체적 저장 방식은 아키텍처 단계에서 결정).
**Related Epic:** EPIC-004

---

### FR-020: 외부 플랫폼 자동 발행 연동 — WON'T (this release)
**Description:** 블로그 초안을 외부 블로그 플랫폼(예: Velog, Tistory 등)에 자동으로 포스팅하는
기능. 이번 릴리스에서는 제외하며 발행은 사용자가 export된 Markdown으로 수동 진행한다.
**Related Epic:** EPIC-004

---

## Non-Functional Requirements

> Every NFR must be measurable, with a stated measurement method.

### NFR-001: 무상 인프라 운영 — MUST (Operability / Cost)
**Description:** 시스템은 AWS EC2/RDS/S3 등 비용이 발생하는 인프라 없이, 무료 또는 저비용 티어
서비스만으로 운영 가능해야 한다.
**Acceptance / Threshold:** 배포/운영에 필요한 모든 구성요소(호스팅, DB, 스토리지)가 선택된 스택의
무료 티어 한도 내에서 개인(1인) 사용 트래픽을 감당할 수 있어야 한다.
**Measurement Method:** 아키텍처 단계에서 후보 스택별 무료 티어 한도 검증. 운영 중 매월 실제
청구 비용 확인($0 목표).

### NFR-002: GitHub Access Token 보안 — MUST (Security)
**Description:** 저장되는 GitHub access token은 평문으로 저장되지 않아야 한다.
**Acceptance / Threshold:** DB에 저장되는 GitHub access token은 암호화(예: AES-256 또는 동등 수준)
되어 있어야 한다.
**Measurement Method:** 코드 리뷰 시 저장 로직 확인. DB 덤프에서 평문 토큰이 발견되지 않아야 한다.

### NFR-003: 분석 Job 실패 처리 — MUST (Reliability)
**Description:** GitHub API 또는 OpenAI API 호출 실패 시 분석 Job은 안전하게 FAILED 상태로
전이되어야 하며, 사용자에게 원인 파악이 가능한 에러 메시지를 제공해야 한다.
**Acceptance / Threshold:** 외부 API 호출 실패 시 100% FAILED 상태 전이 + errorMessage 기록
(무한 대기/PENDING 고착 없음).
**Measurement Method:** 외부 API 실패를 인위적으로 재현해 Job 상태 전이 확인.

### NFR-004: 분석 상태 확인성 — SHOULD (Usability)
**Description:** 사용자는 분석 Job의 진행 상태를 폴링을 통해 확인할 수 있어야 한다.
**Acceptance / Threshold:** 분석 상태 조회 API는 항상 최신 상태(PENDING/PROCESSING/COMPLETED/
FAILED)를 반환해야 한다.
**Measurement Method:** Job 상태 변경 직후 상태 조회 API 호출로 최신 값 반환 여부 확인.

### NFR-005: 도메인 경계 유지 — SHOULD (Maintainability)
**Description:** auth/user/analysis/note/blog 도메인 간 직접 데이터 접근(Repository 직접 호출
등)을 금지하고, 도메인 간 상호작용은 서비스 계층을 통해서만 이루어져야 한다 (기존 설계 원칙 유지).
**Acceptance / Threshold:** 코드 리뷰 시 도메인 간 직접 Repository 참조가 발견되지 않아야 한다.
**Measurement Method:** 코드 리뷰 / 정적 분석(아키텍처 단계에서 구체적 방식 결정).

---

## Epics and User Stories (Outline)

> This is an OUTLINE. Detailed, ready-for-dev story files are compiled later by the sprint/story
> skills. No story points, velocity, or estimates here — delivery is count-based.

### EPIC-001: 인증 & 사용자 관리
**Business Value:** 안전한 GitHub 기반 로그인으로 개인 데이터를 보호하고 서비스 접근을 제어한다.
**User Segments:** 본인 (1인 사용자)
**Related Requirements:** FR-001, FR-002, FR-003, FR-004, FR-005

**User Stories (sketch):**
- **STORY-001:** As a 사용자, I want GitHub 계정으로 로그인하고 싶다, so that 별도 회원가입 없이
  바로 서비스를 이용할 수 있다.
  - Given GitHub 계정을 가진 사용자가, when GitHub OAuth 로그인을 완료하면, then JWT Access/Refresh
    Token이 발급되고 사용자 레코드가 존재한다.
- **STORY-002:** As a 사용자, I want Access Token이 만료되면 자동으로 재발급받고 싶다, so that
  로그인 상태가 끊기지 않는다.
  - Given 유효한 Refresh Token을 가진 사용자가, when 재발급을 요청하면, then 새 Access Token을
    받는다.

---

### EPIC-002: Repo 분석 (커밋/PR 포함)
**Business Value:** README/디렉토리 구조뿐 아니라 실제 개발 흐름(커밋/PR)까지 반영한 분석으로
학습 노트 품질을 높인다.
**User Segments:** 본인 (1인 사용자)
**Related Requirements:** FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012

**User Stories (sketch):**
- **STORY-003:** As a 사용자, I want repo URL을 입력해 분석을 요청하고 싶다, so that 수동으로
  코드를 훑어보지 않아도 된다.
  - Given 유효한 GitHub repo URL을 가진 사용자가, when 분석을 요청하면, then PENDING 상태의 Job이
    생성된다.
- **STORY-004:** As a 사용자, I want 지정 브랜치의 커밋/PR까지 분석에 포함되길 원한다, so that
  실제 개발 과정이 반영된 노트를 받을 수 있다.
  - Given PENDING 상태의 Job이, when 비동기 처리가 시작되면, then README+디렉토리 구조에 더해
    지정 브랜치의 커밋 메시지와 PR이 함께 수집된다.
- **STORY-005:** As a 사용자, I want 분석 진행 상태를 확인하고 싶다, so that 완료 시점을 알 수 있다.
  - Given 생성된 Job이, when 상태를 폴링하면, then 현재 상태(PENDING/PROCESSING/COMPLETED/FAILED)를
    받는다.

---

### EPIC-003: 학습 노트
**Business Value:** 분석 결과를 재사용 가능한 학습 기록으로 축적한다.
**User Segments:** 본인 (1인 사용자)
**Related Requirements:** FR-013, FR-014, FR-015, FR-016

**User Stories (sketch):**
- **STORY-006:** As a 사용자, I want 분석 완료 후 정리된 학습 노트를 자동으로 받고 싶다, so that
  직접 요약하지 않아도 핵심을 파악할 수 있다.
  - Given COMPLETED 상태로 전이된 Job이, when 노트 생성이 완료되면, then 요약/핵심개념/아키텍처
    설명/학습포인트가 포함된 노트가 저장된다.
- **STORY-007:** As a 사용자, I want 과거에 생성한 노트를 목록/상세로 다시 찾아보고 싶다, so that
  학습한 내용을 복습할 수 있다.

---

### EPIC-004: 블로그 초안 & Export
**Business Value:** 노트를 발행 직전 단계까지 자동화해 실제 발행 확률을 높인다.
**User Segments:** 본인 (1인 사용자)
**Related Requirements:** FR-017, FR-018, FR-019, FR-020

**User Stories (sketch):**
- **STORY-008:** As a 사용자, I want 노트를 기반으로 블로그 초안을 자동 생성하고 싶다, so that
  블로그 글쓰기의 초기 부담을 줄일 수 있다.
- **STORY-009:** As a 사용자, I want 블로그 초안을 Markdown 파일로 내려받고 싶다, so that 내가
  원하는 플랫폼에 수동으로 발행할 수 있다.
  - Given 생성된 블로그 초안이, when export를 요청하면, then 다운로드 가능한 `.md` 파일(또는 URL)을
    받는다.

_Continue — 상세 스토리 파일은 `bmad-epics-and-stories` 단계에서 컴파일됨._

---

## Prioritization Summary (MoSCoW)

| Priority | Requirements | Rationale |
|----------|--------------|-----------|
| Must | FR-001, FR-002, FR-003, FR-006, FR-007, FR-008, FR-009, FR-010, FR-013, FR-014, FR-015, FR-017, FR-018, FR-019, NFR-001, NFR-002, NFR-003 | 핵심 사용자 흐름(로그인 → 분석 → 노트 → 블로그 export)과 비용/보안/신뢰성 제약을 충족하지 않으면 서비스가 성립하지 않음 |
| Should | FR-004, FR-011, FR-012, FR-016, NFR-004, NFR-005 | 사용성/효율을 높이지만 없어도 핵심 흐름은 동작함 |
| Could | FR-005 | 있으면 좋지만 1인 전용 서비스 특성상 우선순위 낮음 |
| Won't (this release) | FR-020 (자동 발행 연동), 다중 브랜치 비교 분석, 퀴즈/복습 관리, 일일 분석 요청 한도(rate limiting) | 본인 전용 스코프에서 불필요하다고 판단 (product brief 및 PRD 논의에서 확정) |

---

## Success Metrics

| Metric | Baseline | Target | Measurement Method | Frequency |
|--------|----------|--------|--------------------|-----------|
| 분석 완료 건수 | 0 | repo 3~5건 | 분석 Job 완료 건수 (본인 확인) | 3개월 시점 |
| 블로그 발행 전환 | 0 | 최소 1건 | 실제 발행 여부 (본인 확인) | 3개월 시점 |
| 사용 빈도 | 비정기적 | 주 1회 이상 | 분석 Job 생성 빈도 | 6개월 시점 |
| 인프라 비용 | - | $0 (무료 티어) | 매월 실제 청구 비용 확인 | 매월 |

---

## Assumptions and Dependencies

### Assumptions
1. 무료/저비용 티어로도 개인 사용 트래픽(본인 1인)은 충분히 감당 가능하다.
2. 기존 도메인 로직(OAuth, Job 비동기 처리)은 새 스택에서도 동등하게 구현 가능하다.
3. 지정 브랜치 1개 범위로 한정하면 GitHub API 호출량이 무료 티어/개인 사용 수준에서 감당 가능하다.

### Dependencies
| Dependency | Type | Owner | Status | Risk | Mitigation |
|------------|------|-------|--------|------|------------|
| GitHub REST API (OAuth2, repo/commit/PR) | External | GitHub | Active | API 정책/rate limit 변경 | 캐싱, 단일 브랜치 범위 제한 |
| OpenAI API (GPT-4o, GPT-4o mini) | External | OpenAI | Active | 비용/응답 지연 | 데이터 요약·필터링, 저비용 모델 활용 |
| 무료/저비용 배포 스택 선정 | Internal (planning) | 본인 | Pending | 성능/한도 부족 가능성 | 아키텍처 단계에서 후보 스택 검증 |

---

## Constraints

- **Technical:** GitHub REST API, OpenAI API(GPT-4o/GPT-4o mini) 외부 의존성 유지. 기존 도메인
  경계(auth/user/analysis/note/blog) 유지.
- **Business:** AWS 등 유상 인프라 사용 금지 (무료/저비용 스택 우선). 1인 개발.
- **Timeline:** 하드 데드라인 없음. AI-Native 개발 방식으로 빠르게 완성해 바로 실사용 시작.

---

## Out of Scope

| Excluded | Reason | Revisit? |
|----------|--------|----------|
| 여러 브랜치 비교 분석 | GitHub API 호출량·복잡도 증가, 1차 스코프에서는 단일 브랜치로 충분 | 향후 확장 후보 |
| 퀴즈/복습 관리 기능 | 기존 README상 "예정" 항목, 이번 재구축 스코프에서는 미룸 | 향후 확장 후보 |
| 외부 플랫폼 자동 발행 연동 | 발행은 수동으로 충분, 자동화 우선순위 낮음 | 필요 시 향후 검토 |
| 일일 분석 요청 한도(rate limiting) | 1인 전용 서비스라 불필요하다고 판단 | 다중 사용자로 확장 시 재검토 |
| 2차 사용자(본인 외 타인) 대상 확장 | 이번 스코프는 본인 전용 도구로 한정 | 향후 서비스화 시 재검토 |

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| 무료/저비용 스택의 성능 한계 (Job 비동기 처리, DB) | 중 | 중 | 아키텍처 단계에서 후보 스택의 무료 티어 한도 실측 검증 | 본인 |
| GitHub API rate limit (커밋/PR 분석 추가로 호출량 증가) | 중 | 중 | 캐싱 전략 유지, 단일 브랜치로 분석 범위 제한 | 본인 |
| OpenAI API 비용 증가 (커밋/PR까지 분석 시 토큰 증가) | 중 | 중 | 분석 데이터 요약/필터링, GPT-4o mini 등 저비용 모델 활용 | 본인 |
| 1인 개발로 인한 일정 지연 | 낮음 | 중 | 기능을 작은 스토리 단위로 쪼개 순차 배포 | 본인 |

---

## Traceability Matrix

| Requirement | Business Goal | Epic | User Story | Status |
|-------------|---------------|------|------------|--------|
| FR-001 | 안전한 접근 제어 | EPIC-001 | STORY-001 | Draft |
| FR-002 | 안전한 접근 제어 | EPIC-001 | STORY-002 | Draft |
| FR-003 | 안전한 접근 제어 | EPIC-001 | STORY-002 | Draft |
| FR-004 | 사용성 | EPIC-001 | (outline) | Draft |
| FR-005 | 사용성 | EPIC-001 | (outline) | Draft |
| FR-006 | 학습 정리 자동화 | EPIC-002 | STORY-003 | Draft |
| FR-007 | 학습 정리 자동화 | EPIC-002 | STORY-004 | Draft |
| FR-008 | 개발 흐름 반영 (신규) | EPIC-002 | STORY-004 | Draft |
| FR-009 | 개발 흐름 반영 (신규) | EPIC-002 | STORY-004 | Draft |
| FR-010 | 사용성 | EPIC-002 | STORY-005 | Draft |
| FR-011 | 사용성 | EPIC-002 | (outline) | Draft |
| FR-012 | 비용 절감 | EPIC-002 | (outline) | Draft |
| FR-013 | 학습 자산화 | EPIC-003 | STORY-006 | Draft |
| FR-014 | 학습 자산화 | EPIC-003 | STORY-007 | Draft |
| FR-015 | 학습 자산화 | EPIC-003 | STORY-007 | Draft |
| FR-016 | 사용성 | EPIC-003 | (outline) | Draft |
| FR-017 | 발행 자동화 | EPIC-004 | STORY-008 | Draft |
| FR-018 | 발행 자동화 | EPIC-004 | (outline) | Draft |
| FR-019 | 발행 자동화 | EPIC-004 | STORY-009 | Draft |
| FR-020 | (Won't) | EPIC-004 | — | Excluded |
| NFR-001 | 비용 제약 충족 | (cross-cutting) | — | Draft |
| NFR-002 | 데이터 보안 | (cross-cutting) | — | Draft |
| NFR-003 | 신뢰성 | (cross-cutting) | — | Draft |
| NFR-004 | 사용성 | (cross-cutting) | — | Draft |
| NFR-005 | 유지보수성 | (cross-cutting) | — | Draft |

---

## Handoff

- **To Architecture:** 무료/저비용 배포가 가능한 풀스택(백엔드/프런트엔드/DB/스토리지) 후보를
  선정하고, 기존 도메인 구조(auth/user/analysis/note/blog)와 비동기 Job 처리, GitHub 커밋/PR
  수집 방식을 새 스택에 맞게 설계해야 한다.
- **To Sprint/Story Planning:** 위 EPIC-001~004 아웃라인이 스토리 컴파일의 소스.
- **Open questions / overflow:** `addendum.md` 참고 — 커밋 수집 범위(최근 N개), export 파일 저장
  방식의 구체안은 아키텍처 단계에서 결정.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-03 | sejong | Initial draft |
