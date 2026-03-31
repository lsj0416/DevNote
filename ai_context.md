# DevNote AI Context

## 한 줄 소개

DevNote는 GitHub 저장소를 분석해 개발 학습 노트와 블로그 초안을 생성하는 AI 기반 학습 서비스입니다.

## Monorepo 구조

- `backend/`: Spring Boot API 서버
- `frontend/`: React 클라이언트 예정
- `docs/`: 설계 문서와 운영 문서
- `infra/`: Docker Compose 및 로컬 인프라 설정

## 문서 지도

- [README.md](/Users/sejong/Desktop/Project/devnote/README.md): 프로젝트 전체 개요
- [backend/README.md](/Users/sejong/Desktop/Project/devnote/backend/README.md): 백엔드 실행 가이드
- [frontend/README.md](/Users/sejong/Desktop/Project/devnote/frontend/README.md): 프론트엔드 계획/초기화 가이드
- [infra/README.md](/Users/sejong/Desktop/Project/devnote/infra/README.md): 로컬 인프라 실행 가이드
- [docs/architecture.md](/Users/sejong/Desktop/Project/devnote/docs/architecture.md): 시스템 아키텍처
- [docs/api.md](/Users/sejong/Desktop/Project/devnote/docs/api.md): API 명세
- [docs/domain.md](/Users/sejong/Desktop/Project/devnote/docs/domain.md): 도메인 구조
- [docs/erd.md](/Users/sejong/Desktop/Project/devnote/docs/erd.md): ERD 설계
- [docs/prompt.md](/Users/sejong/Desktop/Project/devnote/docs/prompt.md): AI 프롬프트 전략
- [docs/frontend-plan.md](/Users/sejong/Desktop/Project/devnote/docs/frontend-plan.md): 프론트엔드 구현 기획안
- [docs/workflows/backend.md](/Users/sejong/Desktop/Project/devnote/docs/workflows/backend.md): 백엔드 Step workflow
- [docs/workflows/frontend.md](/Users/sejong/Desktop/Project/devnote/docs/workflows/frontend.md): 프론트엔드 Step workflow

## 로컬 실행 기준

- 인프라 실행: `docker compose -f infra/docker-compose.yml up -d`
- 백엔드 실행: `cd backend && ./gradlew bootRun`
- PostgreSQL: `5432`
- Redis: `6380`
- Backend: `8080`

## 환경 설정 기준

- 환경변수 파일은 `backend/.env`를 사용합니다.
- [application.yml](/Users/sejong/Desktop/Project/devnote/backend/src/main/resources/application.yml) 의 `spring.config.import`로 `.env`를 자동 로드합니다.
- 로컬 Redis는 포트 충돌 회피를 위해 `6380`을 사용합니다.

## 현재 결정사항

- 저장소는 monorepo 구조로 운영합니다.
- 평소 구현 작업은 Codex CLI 중심으로 진행합니다.
- 큰 방향 정리, 리뷰, 설계 검토는 Codex App/Web를 필요 시 사용합니다.
- 운영 문서는 `ai_context.md` + workflow 문서 2개로 유지합니다.
- workflow 문서는 Step 파일 분할 대신 영역별 누적 방식으로 관리합니다.

## 작업 원칙

- 새 CLI 세션은 항상 `ai_context.md`와 대상 workflow 문서를 먼저 읽습니다.
- 공통 사실은 `ai_context.md`에만 기록합니다.
- 실행 순서와 다음 작업은 workflow 문서에 기록합니다.
- 긴 세션 로그나 회고는 workflow 문서에 누적하지 않습니다.
- App/Web에서 정리한 방향은 다음 Step으로 workflow 문서에 내려서 CLI가 수행합니다.

## 세션 시작 규칙

1. `ai_context.md` 읽기
2. 대상 영역 workflow 읽기
3. `git status --short` 확인
4. workflow 상단의 `다음 우선 Step`부터 진행

## 세션 종료 규칙

1. 해당 Step 상태 갱신
2. 검증 결과를 1~3줄로 기록
3. 다음 세션의 첫 행동을 명시

