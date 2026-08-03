# PRD Addendum — DevNote AI

**Companion to:** `prd.md`
**Version:** 1.0
**Date:** 2026-08-03

> Overflow and working notes that would bloat the PRD. Nothing here is the source of truth for
> *what* to build — that stays in `prd.md`. Decisions belong in `decision-log.md`, not here.

---

## Open Questions

| # | Question | Owner | Needed By | Status |
|---|----------|-------|-----------|--------|
| Q1 | 커밋 메시지 수집 범위(최근 N개, 또는 기간 기준)를 구체적으로 몇 개/며칠로 잡을지 | 본인 | architecture 단계 | open |
| Q2 | 블로그 초안 Markdown export 파일을 어디에 저장할지 (S3 대체재: Cloudflare R2, GitHub Gist 등) | 본인 | architecture 단계 | open |
| Q3 | 분석 대상 브랜치를 사용자가 매번 지정하게 할지, 기본값(main/master 자동 감지)으로 둘지 | 본인 | architecture/구현 단계 | open |

---

## Deferred Requirements (parked, not cut)

> Candidate FRs/NFRs not promoted into this release. Keep the wording so they can be lifted into
> `prd.md` later without rework.

- **DEF-001 (다중 브랜치 비교 분석):** 여러 브랜치를 함께 분석해 브랜치별 작업 흐름을 비교하는
  기능 — *reason deferred:* GitHub API 호출량·복잡도 증가, 1차 스코프는 단일 브랜치로 충분.
- **DEF-002 (퀴즈/복습 관리):** 노트 기반 퀴즈 생성 및 복습 일정 관리 (기존 `quizzes`,
  `review_schedules` 테이블에 해당) — *reason deferred:* 기존 README에서도 "예정" 항목이었고
  이번 재구축에서도 우선순위 낮음.
- **DEF-003 (외부 플랫폼 자동 발행):** 블로그 초안을 Velog/Tistory 등에 자동 포스팅 — *reason
  deferred:* 수동 발행으로 충분하다고 판단 (FR-020, Won't).
- **DEF-004 (일일 분석 요청 한도):** 비용 보호 목적의 rate limiting — *reason deferred:* 1인
  전용 서비스라 불필요하다고 판단.
- **DEF-005 (2차 사용자 대상 확장):** 본인 외 다른 개발자에게도 서비스를 여는 것 — *reason
  deferred:* 이번 스코프는 본인 전용 도구로 한정.

---

## Supporting Research / References

- 기존 프로젝트 문서: `docs/architecture.md`, `docs/domain.md`, `docs/api.md`, `docs/erd.md`
- `bmad-output/product-brief-devnote-ai-2026-08-03.md`
- `bmad-output/project-context.md`, `bmad-output/decision-log.md`

---

## Glossary

| Term | Definition |
|------|------------|
| Analysis Job | GitHub repo 분석 요청 단위. PENDING → PROCESSING → COMPLETED/FAILED 상태를 가짐 |
| Note | 분석 Job 완료 후 생성되는 AI 학습 노트 |
| BlogDraft | Note를 기반으로 생성되는 블로그 초안, Markdown export 지원 |
