# DevNote Backend

> DevNote의 인증, 분석 Job, 노트, 블로그 초안 생성을 담당하는 Spring Boot API 서버

## Overview

백엔드는 아래 기능을 제공합니다.

- GitHub OAuth2 로그인
- JWT 기반 인증 / 재발급 / 로그아웃
- GitHub repo 분석 요청 및 비동기 Job 처리
- AI 학습 노트 저장 및 조회
- 블로그 초안 조회 및 Markdown export

## Stack

- Java 21
- Spring Boot 3.5.11
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Redis
- OpenAI API
- GitHub REST API

## Directory

```text
backend/
  src/
  gradle/
  build.gradle
  settings.gradle
  gradlew
  Dockerfile
  .env
  .env.example
```

## Environment Variables

환경변수 예시는 [backend/.env.example](/Users/sejong/Desktop/Project/devnote/backend/.env.example)에 있습니다.
`./gradlew bootRun` 실행 시 [application.yml](/Users/sejong/Desktop/Project/devnote/backend/src/main/resources/application.yml) 의 `spring.config.import` 설정으로 `backend/.env`를 자동 로드합니다.

주요 항목:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`
- `DB_HOST`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `REDIS_HOST`
- `OPENAI_API_KEY`
- `AWS_ACCESS_KEY`
- `AWS_SECRET_KEY`
- `AWS_S3_BUCKET`
- `OAUTH2_REDIRECT_URI`

## Local Development

### 1. 환경변수 준비

```bash
cd backend
cp .env.example .env
```

### 2. 로컬 DB / Redis 실행

```bash
cd ../infra
docker compose up -d
```

기본 포트:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6380`

### 3. 애플리케이션 실행

```bash
cd ../backend
./gradlew bootRun
```

### 4. API 문서 확인

```text
http://localhost:8080/swagger-ui.html
```

## Package Structure

```text
src/main/java/com/devnote
├── global
│   ├── config
│   ├── exception
│   ├── response
│   └── util
└── domain
    ├── auth
    ├── user
    ├── analysis
    ├── note
    └── blog
```

## Main API Domains

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/analysis`
- `/api/v1/notes`
- `/api/v1/notes/{noteId}/blog-draft`

상세 명세는 [docs/api.md](/Users/sejong/Desktop/Project/devnote/docs/api.md)를 참고하세요.

## Docker

[backend/Dockerfile](/Users/sejong/Desktop/Project/devnote/backend/Dockerfile)은 백엔드 앱 이미지를 빌드하기 위한 파일입니다. monorepo 구조에서는 일반적으로 `backend/`를 빌드 컨텍스트로 사용합니다.

## Notes

- 기본 프로파일은 [application.yml](/Users/sejong/Desktop/Project/devnote/backend/src/main/resources/application.yml) 기준 `local`입니다.
- OAuth callback URI와 프론트엔드 로그인 처리 경로는 프론트엔드 구현 시점에 최종 계약이 필요합니다.
- `build/`, `.gradle/`, `bin/`은 로컬 산출물로 간주합니다.
