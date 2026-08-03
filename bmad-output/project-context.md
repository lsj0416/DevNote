# Project Context — DevNote AI

> The project **constitution**. This document is loaded by every BMAD planning skill
> so they all share the same ground truth. Keep it tight, current, and authoritative.
> When a major decision changes scope, update this file and append the change to
> `decision-log.md`.

- **Track:** bmad-method  _(quick-flow | bmad-method | enterprise)_
- **Created:** 2026-08-03T02:46:54Z

---

## Project Goal

GitHub repo URL을 입력하면 AI가 학습 노트와 블로그 초안을 자동 생성해주는 서비스(DevNote AI)를,
현재의 Spring Boot(Gradle) + React 구조에서 풀스택으로 다시 만든다. 배포 비용(AWS EC2/RDS 등)을
들이지 않고 운영할 수 있는 스택으로 전환하는 것이 핵심 목표이며, 사용자 본인이 개발/프로젝트
학습을 진행하며 실제로 사용할 도구를 만드는 것이 "완료"의 기준이다.

## Primary Users

- 1차 사용자: 프로젝트 개발자 본인. 학습 중인 GitHub 레포를 분석해 학습 노트와 블로그 초안을
  자동 생성받아 학습/기록 흐름을 단축하고 싶어함.
- (포트폴리오 목적도 겸함 — README에 "포트폴리오 및 실서비스를 목표로 개발 중"이라 명시)

## Scope

풀스택 마이그레이션/재구축 전체. 기존 Spring Boot 구현이 커버하던 5개 도메인을 새 스택으로
다시 설계·구현한다:
- `auth` — GitHub OAuth2 로그인, JWT 발급/재발급/무효화
- `user` — 사용자 프로필 조회/수정/탈퇴
- `analysis` — repo 분석 Job (비동기 처리, GitHub API + OpenAI API 호출, 상태 폴링).
  기존 README + 디렉토리 구조 분석에 더해, **지정 브랜치(예: main) 1개의 커밋 메시지 + PR
  분석을 보완 데이터로 결합**해 노트 품질을 높인다 (여러 브랜치 비교 분석은 향후 확장 후보).
- `note` — AI 생성 학습 노트 저장/조회/삭제
- `blog` — 블로그 초안 생성 및 Markdown export

프런트엔드(React 기반)도 함께 재구축 대상.

**스택 결정 완료 (2026-08-03, `bmad-output/architecture.md` 참고):** Next.js 단일 풀스택
(App Router, Route Handlers) + PostgreSQL(Neon) + Prisma + Auth.js(GitHub OAuth) + Vercel
(Hobby, Fluid Compute). AWS/S3/별도 백엔드 서버 없이 무료 티어로만 구성.

## Core Constraints

- **비용 제약(최우선)**: AWS EC2/RDS/S3 등 비용이 드는 인프라를 피하고 싶어함 — 이것이
  마이그레이션을 검토하는 근본 이유. 무료/저비용 배포가 가능한 스택을 우선 고려.
- 기존 도메인 로직(OAuth2 GitHub 로그인, Job 기반 비동기 분석, OpenAI 연동)은 기능적으로
  유지되어야 함 — 새 스택에서도 동등한 사용자 흐름 제공.
- 외부 의존성 유지: GitHub REST API, OpenAI API(GPT-4o / GPT-4o mini).
- 1인 개발이므로 과도하게 복잡한 인프라/운영 부담을 지는 스택은 지양.

## Non-Goals

- AWS 기반 인프라(EC2/RDS/S3, Nginx 리버스 프록시)를 그대로 유지하는 것은 비목표 — 전환/대체 대상.
- 엄격한 보안/컴플라이언스 요구사항(결제, 의료정보, 규제 데이터 등) 대응은 비목표.
- 다중 팀 협업 프로세스 설계는 비목표 (1인 개발).
- 퀴즈/복습 관리 기능은 README상 "예정" 항목으로 이번 스코프의 필수 범위는 아님 (별도 확인 필요).
- 다중 브랜치 비교 분석(브랜치 간 작업 흐름 비교)은 이번 스코프에서 제외 — 향후 확장 후보로만 기록.

## Key Stakeholders / Roles

- 1인 개발자(사용자 본인)가 기획, 설계, 구현, 검토를 모두 수행. 별도 팀/리뷰어 없음.

## Glossary

- **Analysis Job**: GitHub repo 분석 요청 단위. PENDING → PROCESSING → COMPLETED/FAILED 상태를 가짐.
- **Note**: 분석 Job 완료 후 생성되는 AI 학습 노트.
- **BlogDraft**: Note를 기반으로 생성되는 블로그 초안, Markdown export 지원.

---

## Decision Thread

Running decisions live in [`decision-log.md`](./decision-log.md). The first entry is
the track choice from initialization. Consult it before making decisions that might
contradict earlier ones.

## Planning Status (count-based)

- **Track:** bmad-method
- **Stories defined:** _(updated by sprint-planning / story creation)_
- **Stories remaining:** _(count-based delivery — no points, no velocity)_

_This document plans the work. Implementation is handed to external dev tools via
ready-for-dev story files; the planning plugin never writes or tests application code._
