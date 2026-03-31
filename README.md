# DevNote

> GitHub 저장소를 분석해 학습 노트와 블로그 초안을 생성하는 AI 기반 개발 학습 서비스

## Overview

DevNote는 개발자가 반복적으로 수행하는 학습 정리 흐름을 자동화하는 것을 목표로 합니다.

```text
GitHub 로그인
  → repo URL 입력
  → AI 학습 노트 생성
  → 블로그 초안 생성
  → 퀴즈 / 복습 기능으로 확장 예정
```

현재 저장소는 백엔드와 프론트엔드를 함께 관리하는 monorepo 구조를 사용합니다.

## Monorepo Structure

```text
devnote/
  backend/   Spring Boot API 서버
  frontend/  React 클라이언트
  docs/      공통 설계 문서
  infra/     Docker Compose 및 인프라 관련 파일
```

### Directory Guide

- [backend](/Users/sejong/Desktop/Project/devnote/backend): 인증, 분석 Job, 노트, 블로그 초안을 제공하는 API 서버
- [frontend](/Users/sejong/Desktop/Project/devnote/frontend): 사용자 UI와 분석 흐름을 담당하는 클라이언트
- [docs](/Users/sejong/Desktop/Project/devnote/docs): 아키텍처, API, ERD, 프롬프트, 프론트엔드 기획 문서
- [infra](/Users/sejong/Desktop/Project/devnote/infra): 로컬 개발용 Docker Compose 등 인프라 실행 설정

## Tech Stack

### Backend

- Java 21
- Spring Boot 3.5.11
- Spring Security + JWT
- OAuth2 (GitHub)
- Spring Data JPA

### Database / Cache

- PostgreSQL
- Redis

### AI / External API

- OpenAI GPT-4o
- OpenAI GPT-4o mini
- GitHub REST API

### Frontend

- React 기반 SPA 예정

## Getting Started

### 1. 인프라 실행

```bash
cd infra
docker compose up -d
```

또는 루트에서 바로 실행할 수 있습니다.

```bash
docker compose -f infra/docker-compose.yml up -d
```

기본 로컬 포트:

- PostgreSQL: `5432`
- Redis: `6380`

### 2. 백엔드 실행

```bash
cd backend
cp .env.example .env
./gradlew bootRun
```

백엔드 상세 실행 방법은 [backend/README.md](/Users/sejong/Desktop/Project/devnote/backend/README.md)를 참고하세요.

### 3. 프론트엔드 실행

프론트엔드는 아직 초기화 전입니다. 구조 및 구현 계획은 [docs/frontend-plan.md](/Users/sejong/Desktop/Project/devnote/docs/frontend-plan.md)에 정리되어 있습니다.

## Core Flow

1. 사용자가 GitHub OAuth로 로그인합니다.
2. 대시보드에서 GitHub repo URL을 입력합니다.
3. 백엔드는 분석 Job을 생성하고 비동기로 처리합니다.
4. 프론트엔드는 `jobId` 기준으로 polling 하며 상태를 확인합니다.
5. 완료 시 생성된 학습 노트와 블로그 초안을 조회합니다.

## Documents

- [architecture.md](/Users/sejong/Desktop/Project/devnote/docs/architecture.md): 기술 스택 및 시스템 아키텍처
- [api.md](/Users/sejong/Desktop/Project/devnote/docs/api.md): API 명세
- [domain.md](/Users/sejong/Desktop/Project/devnote/docs/domain.md): 도메인 패키지 구조
- [erd.md](/Users/sejong/Desktop/Project/devnote/docs/erd.md): ERD 설계
- [prompt.md](/Users/sejong/Desktop/Project/devnote/docs/prompt.md): OpenAI 프롬프트 전략
- [frontend-plan.md](/Users/sejong/Desktop/Project/devnote/docs/frontend-plan.md): 프론트엔드 구현 기획안
- [infra/README.md](/Users/sejong/Desktop/Project/devnote/infra/README.md): 로컬 인프라 실행 가이드
- [ai_context.md](/Users/sejong/Desktop/Project/devnote/ai_context.md): Codex 세션 공통 운영 문서
- [docs/workflows/backend.md](/Users/sejong/Desktop/Project/devnote/docs/workflows/backend.md): 백엔드 Step workflow
- [docs/workflows/frontend.md](/Users/sejong/Desktop/Project/devnote/docs/workflows/frontend.md): 프론트엔드 Step workflow

## Notes

- monorepo 기준으로 앱별 실행 파일은 각 하위 폴더에서 관리합니다.
- 백엔드 환경변수는 `backend/.env`를 사용합니다.
- 프론트엔드가 추가되면 앱별 README와 실행 스크립트를 계속 분리 유지하는 것을 권장합니다.
