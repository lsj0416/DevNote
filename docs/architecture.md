# 기술 스택 및 시스템 아키텍처 설계

> v1.0 | 2026.03

---

## 1. 서비스 개요

DevNote AI는 개발자의 학습 흐름 전체를 자동화하는 AI 기반 공부 관리 서비스입니다.

**핵심 흐름**

```
GitHub repo 입력
  → AI 학습 노트 생성
  → 블로그 초안 생성
  → 퀴즈 및 복습 관리 (2차)
```

**MVP 범위**
- GitHub repo URL 입력
- README + 디렉토리 구조 기반 분석
- AI 학습 노트 생성 (구조화 JSON + Markdown 렌더링)
- 블로그 초안 생성 (Markdown export)
- 노트 저장 및 조회
- 회원가입 / 로그인 (GitHub OAuth2)

---

## 2. 기술 스택

### Backend
| 구분 | 기술 | 비고 |
|------|------|------|
| Language | Java 21 | LTS 버전 |
| Framework | Spring Boot 3.5.11 | |
| Security | Spring Security + JWT | Access/Refresh Token 분리 |
| Auth | OAuth2 (GitHub) | GitHub 로그인 + private repo 접근 |
| ORM | Spring Data JPA | Hibernate |
| API Docs | Swagger (SpringDoc) | 개발 단계 API 검증용 |
| Async | @Async + ThreadPoolTaskExecutor | AI 요청 Job 비동기 처리 |

### Database
| 구분 | 기술 | 비고 |
|------|------|------|
| Main DB | PostgreSQL | 사용자, 노트, Job 히스토리 |
| Cache / Session | Redis | Refresh Token, Job 상태, repo 캐싱 |

### AI 연동
| 구분 | 기술 | 비고 |
|------|------|------|
| 노트 생성 | OpenAI GPT-4o | 분석 품질 우선 |
| 블로그 초안 생성 | OpenAI GPT-4o mini | 비용 절감 |
| 분석 범위 | README + 디렉토리 구조 | MVP: 코드 파일 분석 제외 |
| 캐싱 키 | repo URL + last commit SHA | 동일 커밋 재요청 시 캐시 반환 |

### Frontend (MVP)
| 구분 | 기술 | 비고 |
|------|------|------|
| Framework | React (별도 구성) | 추후 FE 영입 대비 API 서버 분리 |

### Infra / DevOps
| 구분 | 기술 | 비고 |
|------|------|------|
| Container | Docker + Docker Compose | 서비스 컨테이너 분리 구성 |
| Cloud | AWS EC2 + RDS + S3 | EC2: 앱 서버, RDS: PostgreSQL, S3: Markdown export |
| CI/CD | GitHub Actions → Jenkins | MVP: Actions, 이후 Jenkins 전환 |
| Reverse Proxy | Nginx | SSL 종료, 정적 파일 서빙 |
| Monitoring | CloudWatch → Grafana | MVP: CloudWatch, 실서비스: Grafana |

---

## 3. 시스템 아키텍처

### 전체 구성도

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
[ S3 (Markdown export 파일) ]
```

### CI/CD 파이프라인

```
GitHub
  │  PR merge (main)
GitHub Actions
  │  빌드 → 테스트 → Docker 이미지 빌드
  │  이미지 push (commit SHA 태깅)
EC2
  │  새 이미지 pull → 컨테이너 재시작
  │  Health check → 실패 시 이전 이미지 롤백
```

---

## 4. AI 분석 요청 흐름 (Job 기반 비동기)

| 단계 | 작업 | 비고 |
|------|------|------|
| 1 | 사용자가 GitHub repo URL 입력 → `POST /api/v1/analysis` | |
| 2 | 서버: Job 생성 (status = PENDING) → jobId 반환 | |
| 3 | @Async 스레드 풀에서 GitHub API 호출 | README, 디렉토리 구조 수집 |
| 4 | 수집 데이터 → OpenAI API 호출 | 프롬프트 전송 |
| 5 | AI 응답 → 구조화 JSON 파싱 → DB 저장 (status = COMPLETED) | |
| 6 | 클라이언트: `GET /api/v1/analysis/{jobId}` polling | 완료 시 결과 조회 |
| 7 | 실패 시 status = FAILED, 재시도 가능 (최대 2회) | |

---

## 5. 인증 흐름 (GitHub OAuth2 + JWT)

| 단계 | 작업 |
|------|------|
| 1 | `GET /api/v1/oauth2/authorization/github` → GitHub 로그인 페이지 리다이렉트 |
| 2 | GitHub 인증 완료 → Callback URL로 authorization code 반환 |
| 3 | 서버: authorization code로 GitHub access_token 교환 |
| 4 | GitHub access_token으로 사용자 정보 조회 |
| 5 | DB 사용자 조회/생성 → JWT Access Token + Refresh Token 발급 |
| 6 | Refresh Token: Redis 저장 (TTL 14일), Access Token: 클라이언트 반환 |
| 7 | Access Token 만료 → `POST /api/v1/auth/refresh` → Refresh Token 검증 → 재발급 |

---

## 6. 기술 변경 로드맵

| 항목 | MVP | 중반 | 실서비스 |
|------|-----|------|---------|
| Job Queue | @Async | Redis Queue | Kafka |
| CI/CD | GitHub Actions | Jenkins | Jenkins |
| Monitoring | CloudWatch | - | Grafana |
| 파일 분석 | README + 디렉토리 구조 | 선택 폴더 | 파일 단위 청킹 |

---

## 7. 미결정 사항

| 항목 | 검토 내용 |
|------|-----------|
| OpenAI 프롬프트 전략 | 시스템 프롬프트 구조, 출력 JSON schema 정의 |
| Rate Limit / 비용 제어 | 사용자별 일일 분석 횟수 제한 정책 |
| Polling vs SSE | AI 응답 완료 알림 방식 결정 (2차 고려) |
| QueryDSL 도입 시점 | 노트 검색/필터 기능 개발 시 도입 |
