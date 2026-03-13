# DevNote AI

> 개발자의 학습 흐름을 자동화하는 AI 기반 공부 노트 서비스

<br>

## 📌 프로젝트 소개

GitHub repo URL을 입력하면 AI가 학습 노트와 블로그 초안을 자동으로 생성해주는 서비스입니다.

개발자가 공부할 때 반복하는 흐름을 자동화합니다.

```
GitHub repo 입력
  → AI 학습 노트 생성
  → 블로그 초안 생성
  → 퀴즈 및 복습 관리 (예정)
```

<br>

## 🛠 기술 스택

### Backend
| 분류 | 기술                              |
|------|---------------------------------|
| Language | Java 21                         |
| Framework | Spring Boot 3.5.11              |
| Security | Spring Security + JWT           |
| Auth | OAuth2 (GitHub)                 |
| ORM | Spring Data JPA                 |
| Async | @Async + ThreadPoolTaskExecutor |

### Database
| 분류 | 기술 |
|------|------|
| Main DB | PostgreSQL |
| Cache | Redis |

### AI / External API
| 분류 | 기술 |
|------|------|
| 노트 생성 | OpenAI GPT-4o |
| 블로그 초안 생성 | OpenAI GPT-4o mini |
| repo 분석 | GitHub REST API |

### Infra / DevOps
| 분류 | 기술 |
|------|------|
| Container | Docker / Docker Compose |
| Cloud | AWS EC2 + RDS + S3 |
| CI/CD | GitHub Actions |
| Reverse Proxy | Nginx |

<br>

## 🏗 시스템 아키텍처

```
[ Client (React) ]
       │  HTTPS
[ Nginx (Reverse Proxy / SSL) ]
       │  /api/v1/*
[ Spring Boot App (EC2) ]
   │           │           │
[ PostgreSQL ] [ Redis ]  [ OpenAI API ]
   (RDS)                  [ GitHub API ]
       │
[ S3 (Markdown export) ]
```

### AI 분석 요청 흐름 (Job 기반 비동기)

```
1. POST /api/v1/analysis       → Job 생성 (PENDING)
2. @Async 스레드               → GitHub API 호출 (README, 디렉토리 구조)
3. OpenAI API 호출             → 학습 노트 생성
4. DB 저장                     → Job 상태 COMPLETED
5. GET /api/v1/analysis/{jobId} → 클라이언트 polling
```

<br>

## 🚀 실행 방법

### 사전 준비

- Java 21
- Docker / Docker Compose
- GitHub OAuth App 생성 ([가이드](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app))
- OpenAI API Key

### 1. 레포지토리 클론

```bash
git clone https://github.com/{username}/devnote.git
cd devnote
```

### 2. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 열어서 값 입력
```

### 3. 로컬 DB / Redis 실행

```bash
docker-compose up -d
```

### 4. 애플리케이션 실행

```bash
./gradlew bootRun
```

또는 IntelliJ에서 `DevNoteApplication.java` 실행
(EnvFile 플러그인으로 `.env` 파일 연결 필요)

### 5. API 문서 확인

```
http://localhost:8080/swagger-ui.html
```

<br>

## 📁 프로젝트 구조

```
src/main/java/com/devnote
├── DevNoteApplication.java
│
├── global                        # 전역 공통 모듈
│   ├── config                    # JPA, Redis, Async, Security 설정
│   ├── exception                 # GlobalExceptionHandler, ErrorCode
│   ├── response                  # ApiResponse<T>
│   └── util                      # 공통 유틸
│
└── domain
    ├── auth                      # 인증 (OAuth2, JWT)
    ├── user                      # 사용자 관리
    ├── analysis                  # repo 분석 Job
    ├── note                      # 학습 노트
    └── blog                      # 블로그 초안
```

<br>

## 📄 문서

| 문서                              | 설명 |
|---------------------------------|------|
| [아키텍처 설계](docs/architecture.md) | 기술 스택 및 시스템 아키텍처 |
| [ERD 설계](docs/erd.md)           | 테이블 구조 및 관계 |
| [API 명세](docs/api.md)           | 엔드포인트 상세 명세 |
| [프롬프트 전략](docs/prompt.md)       | OpenAI 프롬프트 설계 |
| [도메인 패키지 구조](docs/domain.md)    | 패키지 구조 및 설계 원칙 |

<br>

---

> 본 프로젝트는 포트폴리오 및 실서비스를 목표로 개발 중입니다.
