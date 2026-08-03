# Product Brief: DevNote AI

**Date:** 2026-08-03
**Author:** sejong (1인 개발)
**Status:** Draft — ready for PRD
**Version:** 1.0

---

## 1. Executive Summary

DevNote AI는 GitHub repo URL 하나만 입력하면 README, 디렉토리 구조, 그리고 지정 브랜치의 커밋
메시지·PR 흐름을 AI가 분석해 학습 노트와 블로그 초안(Markdown)을 자동 생성해주는 개인 학습 도구다.
현재 Spring Boot + React로 구현되어 있는 것을 AWS 등 비용이 드는 인프라 없이 운영 가능한 스택으로
풀스택 재구축하는 것이 이번 계획의 핵심이다.

**Key Points:**
- Problem: GitHub repo를 학습할 때 README/코드/커밋·PR 흐름을 훑고 정리해서 발행까지 이어가는 과정이 매번 수작업이라 기록이 재사용 가능한 자산으로 남지 않는다.
- Solution: repo URL 입력 → AI가 README+디렉토리+커밋/PR을 분석 → 학습 노트 생성 → 블로그 초안(Markdown) 생성, 발행은 수동.
- Target Users: 본인(1인 개발자, 여러 프로젝트/오픈소스를 학습하며 실력을 쌓는 개발자) — 이번 스코프는 본인 전용으로 좁힘.
- Primary Metric: 3개월 내 repo 3~5개 분석 + 블로그 최소 1건 발행, 6개월 내 주 1회 이상 사용하는 습관 정착, AWS 비용 없이 운영 유지.

---

## 2. Problem Statement

### The Problem

개발자가 GitHub repo를 학습할 때 README, 코드, 커밋/PR 흐름을 훑으며 "무엇을, 왜, 어떻게"
개발했는지 파악하고 정리하는 과정을 반복하지만, 이 정리가 매번 수작업이라 시간이 들고 블로그
발행까지 이어지지 못해 나중에 다시 찾아보거나 복습하기 어렵다. 정리 → 발행까지 자동화되어야
학습 기록이 실제로 재사용 가능한 자산이 된다.

### Who Experiences This Problem

**Primary Users:**
- 본인 — 여러 프로젝트/오픈소스 레포를 학습하며 실력을 쌓아가는 개발자

**Secondary Users:**
- 없음 (이번 스코프에서는 본인 전용으로 한정. 다른 개발자 대상 확장은 Non-Goals로 명시)

### Current Situation

**How Users Currently Handle This:**
README와 코드를 직접 훑어보고, 필요하면 커밋/PR 히스토리를 따라가며 흐름을 파악한 뒤 스스로
노트를 정리한다. 블로그화까지는 별도의 수작업 단계가 필요해 자주 이어지지 않는다.

**Pain Points:**
- 정리 자체가 매번 수작업이라 시간이 오래 걸림
- README/코드만으로는 "왜, 어떻게" 개발했는지(작업 흐름)까지 파악하기 어려움
- 정리된 내용이 블로그 발행까지 이어지지 않아 기록이 흩어지고 재사용되지 못함

### Impact & Urgency

**Impact if Unsolved:**
학습 정리에 드는 시간이 낭비되고, 기록이 남지 않아 나중에 복기하기 어렵다. 블로그 발행까지
이어지지 못해 학습 자산이 축적되지 않는다.

**Why Now:**
AI-Native 개발 방식으로 빠르게 만들어 바로 학습 루틴에 써먹으려는 목적. 별도 하드 데드라인은
없지만 최대한 빠르게 실사용을 시작하고 싶어함.

**Frequency:**
새 프로젝트/레포를 학습할 때마다 반복되는 문제.

---

## 3. Target Users

### User Personas

#### Persona 1: 본인 (1인 개발자 겸 학습자)

- **Role:** 여러 프로젝트/오픈소스 repo를 학습하며 실력을 쌓는 개발자, 이 도구의 유일한 사용자이자 개발자
- **Goals:** repo 학습 내용을 빠르게 노트로 정리하고, 블로그로 발행해 나중에 쉽게 찾아보고 복습하고 싶음
- **Pain Points:** 정리와 발행까지 이어지는 과정이 수작업이라 번거로움; 커밋/PR 흐름까지 반영한 깊이 있는 정리가 특히 손이 많이 감
- **Technical Proficiency:** GitHub/Git 흐름에 익숙한 개발자
- **Usage Pattern:** 새 repo를 학습할 때마다 (목표: 주 1회 이상)

#### Persona 2: (해당 없음)

- 이번 스코프는 본인 전용으로 한정 — 2차 페르소나 없음 (향후 확장 시 재검토)

### User Needs

**Must Have (MVP):**
- GitHub OAuth 로그인
- repo URL 입력 → 분석 Job 생성 (비동기, 상태 폴링)
- README + 디렉토리 구조 + 지정 단일 브랜치의 커밋 메시지·PR 분석
- AI 학습 노트 생성/저장/조회

**Should Have:**
- 노트 기반 블로그 초안 생성
- 블로그 초안 Markdown export

**Nice to Have (Future):**
- 여러 브랜치 비교 분석
- 퀴즈/복습 관리 기능

---

## 4. Proposed Solution

### Solution Overview

GitHub repo URL 하나만 입력하면, README + 디렉토리 구조 + 지정 브랜치의 커밋 메시지·PR 흐름을
AI가 분석해 학습 노트와 블로그 초안(Markdown)을 자동 생성해준다. 사람이 하던 "읽고 이해하고
정리하는" 과정을 AI가 대신하고, 사용자는 다듬어서 수동으로 발행만 하면 된다.

### Key Capabilities

1. **GitHub 기반 repo 분석 (Analysis Job)**
   - Description: repo URL 입력 시 README + 디렉토리 구조 + 지정 브랜치의 커밋 메시지·PR을
     비동기 Job으로 수집·분석 (PENDING → PROCESSING → COMPLETED/FAILED)
   - User Value: 수작업으로 훑어보던 정보 수집·정리를 자동화

2. **AI 학습 노트 생성**
   - Description: 수집된 데이터를 기반으로 OpenAI API가 학습 노트를 생성, 저장/조회/삭제 가능
   - User Value: "무엇을, 왜, 어떻게" 개발했는지 정리된 형태로 즉시 확인 가능

3. **블로그 초안 생성 + Markdown export**
   - Description: 노트를 기반으로 블로그 초안을 생성하고 Markdown 파일로 export
   - User Value: 발행 직전 단계까지 자동화해 실제 블로그 포스팅으로 이어질 확률을 높임

### Unique Value Proposition

단순 코드/README 요약이 아니라 커밋/PR 기반 "개발 흐름"까지 반영한 학습 관점의 노트를 생성하고,
발행 직전 단계(Markdown)까지 자동화한다는 점이 차별점이다.

### MVP Scope

**Core Features for Launch:**
- GitHub OAuth 로그인 + 사용자 관리
- repo 분석 Job (README + 디렉토리 구조 + 단일 브랜치 커밋/PR)
- AI 학습 노트 생성/저장/조회
- 블로그 초안 생성 + Markdown export

**Deferred to Future Phases:**
- 여러 브랜치 비교 분석
- 퀴즈/복습 관리 기능
- 자동 블로그 발행(포스팅) 연동

---

## 5. Goals & Constraints

### Business Goals

- 본인이 실제 학습 루틴에 바로 써먹을 수 있는 도구를 빠르게 완성한다 (AI-Native 개발 방식 활용).
- 부수적으로 포트폴리오 가치도 확보한다.

### Constraints

**Non-Negotiable Constraints:**
- 비용: AWS EC2/RDS/S3 등 비용이 드는 인프라를 피하고 무료/저비용 스택으로 운영한다 (이번 재구축의 근본 동기).
- 1인 개발: 운영 부담이 큰 복잡한 인프라는 지양한다.

**Technical Constraints:**
- 외부 의존성 유지: GitHub REST API (OAuth2, repo/commit/PR 데이터), OpenAI API (GPT-4o, GPT-4o mini)
- 기존 도메인 로직(OAuth2 GitHub 로그인, Job 기반 비동기 분석, AI 연동)은 새 스택에서도 기능적으로 동등하게 유지되어야 함

---

## 6. Success Metrics

### Primary Metrics

**분석 사용 건수**
- Baseline: 0 (재구축 이전)
- Target: repo 3~5건 분석 완료
- Timeline: 3개월
- Measurement: 분석 Job 완료 건수 (본인 직접 확인)

**블로그 발행 전환**
- Baseline: 0
- Target: 생성된 블로그 초안 중 최소 1건 실제 발행
- Timeline: 3개월
- Measurement: 본인 확인 (수동 발행 여부)

**사용 습관화**
- Baseline: 비정기적 사용
- Target: 주 1회 이상 사용
- Timeline: 6개월
- Measurement: 분석 Job 생성 빈도 (본인 확인)

### Success Vision

- **3 months:** repo 3~5개를 분석해 노트+블로그 초안을 뽑아내고, 최소 1건 이상 실제 블로그에 발행함.
- **6 months:** 새 프로젝트/레포를 학습할 때 "정리 습관"으로 자리잡아 주 1회 이상 사용.
- **12 months:** (미정 — 확장 여부는 이번 스코프 밖. 필요 시 후속 브리프에서 재검토)

---

## 7. Market & Competition

*(개인 전용 도구 성격상 가볍게 다룸 — 사용자 요청에 따라 심층 리서치는 생략)*

### Market Context

**Market Size:** 해당 없음 (본인 전용 도구, 시장 규모 분석 불필요)

**Key Trends:**
- AI 기반 코드/repo 이해 도구(Copilot Workspace, DeepWiki, Sourcegraph Cody 등)의 확산
- 개발자 개인 학습 기록을 블로그로 발행하는 문화

**Target Segment:** 해당 없음 (본인 전용)

### Competitive Landscape

#### GitHub Copilot Workspace / DeepWiki / Sourcegraph Cody
- Strengths: 코드/repo 이해를 돕는 강력한 AI 분석 기능
- Weaknesses: "학습 노트 → 블로그 발행"으로 이어지는 흐름에 특화되어 있지 않음
- Positioning: 코드 이해 보조 도구

### Our Differentiation

**Advantages:**
- 커밋/PR 기반 "개발 흐름" 관점의 학습 노트 생성
- 발행 직전 단계(Markdown export)까지 자동화

**Gaps to Close:**
- 해당 없음 (본인 전용 도구로 경쟁 우위보다 실사용성이 우선)

---

## 8. Risks & Assumptions

### High-Priority Risks

**Risk 1: 무료/저비용 스택의 성능 한계**
- Probability: 중
- Impact: 중
- Mitigation: 아키텍처 단계에서 실제 후보 스택(Vercel/Supabase/Neon 등)의 무료 티어 한도를 검증
- Owner: 본인

**Risk 2: GitHub API rate limit (커밋/PR 분석 추가로 호출량 증가)**
- Probability: 중
- Impact: 중
- Mitigation: 캐싱 전략 유지, 분석 범위를 단일 브랜치로 제한(이미 결정됨)
- Owner: 본인

**Risk 3: OpenAI API 비용 증가 (커밋/PR까지 분석 시 토큰 사용량 증가)**
- Probability: 중
- Impact: 중
- Mitigation: 분석 대상 데이터 요약/필터링, GPT-4o mini 등 저비용 모델 활용
- Owner: 본인

### Critical Assumptions

- 무료/저비용 티어로도 개인 사용 트래픽(본인 1인)은 충분히 감당 가능하다.
- 기존 도메인 로직(OAuth, Job 비동기 처리)은 새 스택에서도 동등하게 구현 가능하다.

**Validation Plan:**
아키텍처 단계에서 후보 스택별 무료 티어 한도와 실제 구현 가능성을 검증한다.

---

## 9. Dependencies

### Internal Dependencies

- 없음 (1인 개발, 외부 팀 의존 없음)

### External Dependencies

- GitHub REST API (OAuth2, repo/commit/PR 데이터)
- OpenAI API (GPT-4o, GPT-4o mini)

### Current Blockers

- 백엔드/프런트엔드 스택 및 비용 없는 배포처 선택 — Resolution: 아키텍처 단계(`bmad-architecture`)에서 결정

---

## 10. Next Steps

### Immediate Actions

1. `bmad-prd`로 PRD 작성 (기능 요구사항 상세화, 5개 도메인 + 커밋/PR 분석 반영)
2. `bmad-architecture`로 스택 및 비용 없는 배포 방식 결정
3. 이후 `bmad-epics-and-stories`로 스토리 분해

### Recommended Handoff

**Hand off to:** Product Manager (PRD 작성)

**Required before handoff:**
- 이 브리프의 MVP 스코프(5개 도메인 + 커밋/PR 분석, 발행은 수동) 확인 완료
- Non-Goals(다중 브랜치 비교, 퀴즈/복습, 자동 발행, 2차 사용자 확장) 확인 완료

---

## Appendix

### Research Sources

- 기존 프로젝트 문서: `docs/architecture.md`, `docs/domain.md`, `docs/api.md`, `docs/erd.md`, `README.md`
- `bmad-output/project-context.md`, `bmad-output/decision-log.md`

### Stakeholders Consulted

- 본인 — 기획/개발/리뷰 전 과정 단독 수행

### Additional Notes

이번 브리프는 기존 Spring Boot + React 구현을 대체할 풀스택 재구축을 전제로 작성되었다. 도메인
범위(auth/user/analysis/note/blog)는 기존 구현과 동일하게 유지하되, analysis 도메인에 커밋/PR
분석이 추가되었고, 대상 사용자는 본인으로 좁혀졌으며, 인프라 비용 회피가 핵심 제약으로 확정되었다.

---

**Document Status:** Draft — ready for PRD
**Last Updated:** 2026-08-03
