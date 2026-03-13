# 도메인 패키지 구조 설계

> 아키텍처 스타일: **레이어드 아키텍처 (Controller - Service - Repository)**
> 패키지 전략: **도메인별 분리**
> 버전: v1.0 | 2026.03

---

## 1. 전체 패키지 구조

```
com.devnote
├── DevNoteApplication.java
│
├── global                              # 전역 공통 모듈
│   ├── config
│   │   ├── AsyncConfig.java            # @Async ThreadPoolTaskExecutor 설정
│   │   ├── BaseEntity.java             # createdAt / updatedAt 공통 엔티티
│   │   ├── JpaConfig.java              # Auditing 활성화
│   │   ├── RedisConfig.java            # Redis 연결 설정
│   │   └── SecurityConfig.java         # Spring Security 설정
│   │
│   ├── exception
│   │   ├── GlobalExceptionHandler.java # @RestControllerAdvice 전역 예외 처리
│   │   ├── BusinessException.java      # 비즈니스 예외 베이스 클래스
│   │   └── ErrorCode.java              # 에러 코드 enum
│   │
│   ├── response
│   │   └── ApiResponse.java            # 공통 응답 래퍼 ApiResponse<T>
│   │
│   └── util
│       ├── SecurityUtil.java           # 현재 인증 사용자 추출 유틸
│       └── RedisUtil.java              # Redis 공통 유틸
│
└── domain
    ├── auth                            # 인증 (OAuth2, JWT)
    │   ├── controller
    │   │   └── AuthController.java     # /api/v1/auth/*
    │   ├── service
    │   │   ├── AuthService.java        # 토큰 재발급, 로그아웃
    │   │   └── CustomOAuth2UserService.java  # OAuth2 로그인 처리
    │   ├── handler
    │   │   ├── OAuth2SuccessHandler.java     # 로그인 성공 시 JWT 발급
    │   │   └── OAuth2FailureHandler.java     # 로그인 실패 처리
    │   ├── jwt
    │   │   ├── JwtTokenProvider.java   # JWT 생성 / 검증 / 파싱
    │   │   └── JwtAuthFilter.java      # OncePerRequestFilter, 요청마다 JWT 검증
    │   └── dto
    │       ├── TokenResponse.java
    │       └── RefreshRequest.java
    │
    ├── user                            # 사용자 관리
    │   ├── controller
    │   │   └── UserController.java     # /api/v1/users/*
    │   ├── service
    │   │   └── UserService.java
    │   ├── repository
    │   │   └── UserRepository.java
    │   ├── entity
    │   │   └── User.java               # @Entity
    │   └── dto
    │       ├── UserResponse.java
    │       └── UserUpdateRequest.java
    │
    ├── analysis                        # repo 분석 Job
    │   ├── controller
    │   │   └── AnalysisController.java # /api/v1/analysis/*
    │   ├── service
    │   │   ├── AnalysisService.java    # Job 생성, 상태 조회, 캐싱 판단
    │   │   └── AnalysisJobProcessor.java  # @Async 실제 분석 처리
    │   ├── repository
    │   │   └── AnalysisJobRepository.java
    │   ├── entity
    │   │   ├── AnalysisJob.java        # @Entity
    │   │   └── JobStatus.java          # PENDING / PROCESSING / COMPLETED / FAILED enum
    │   ├── client
    │   │   ├── GitHubApiClient.java    # GitHub REST API 호출
    │   │   └── OpenAiNoteClient.java   # OpenAI API 호출 (노트 생성, WebFlux 기반)
    │   └── dto
    │       ├── AnalysisRequest.java
    │       ├── JobStatusResponse.java
    │       ├── JobListResponse.java
    │       └── GitHubRepoContext.java  # GitHub 수집 데이터 중간 객체
    │
    ├── note                            # 학습 노트
    │   ├── controller
    │   │   └── NoteController.java     # /api/v1/notes/*
    │   ├── service
    │   │   └── NoteService.java
    │   ├── repository
    │   │   └── NoteRepository.java
    │   ├── entity
    │   │   └── Note.java               # @Entity
    │   └── dto
    │       ├── NoteResponse.java       # 상세 조회 응답
    │       └── NoteListResponse.java   # 목록 조회 응답
    │
    └── blog                            # 블로그 초안
        ├── controller
        │   └── BlogDraftController.java  # /api/v1/notes/{noteId}/blog-draft/*
        ├── service
        │   ├── BlogDraftService.java
        │   └── BlogDraftExportService.java  # S3 Markdown export
        ├── repository
        │   └── BlogDraftRepository.java
        ├── entity
        │   └── BlogDraft.java           # @Entity
        ├── client
        │   └── OpenAiBlogClient.java    # OpenAI API 호출 (블로그 초안 생성, WebFlux 기반)
        └── dto
            ├── BlogDraftResponse.java
            └── BlogExportResponse.java
```

---

## 2. 도메인별 책임 정의

| 도메인 | 책임 | 주요 외부 의존 |
|--------|------|----------------|
| `auth` | GitHub OAuth2 로그인, JWT 발급/재발급/무효화 | Redis (Refresh Token) |
| `user` | 사용자 프로필 조회/수정/탈퇴 | - |
| `analysis` | repo 분석 Job 생성, 비동기 처리, GitHub/OpenAI API 호출 | GitHub API, OpenAI API, Redis (캐싱) |
| `note` | AI 생성 학습 노트 저장/조회/삭제 | - |
| `blog` | 블로그 초안 생성, S3 Markdown export | OpenAI API, AWS S3 |

---

## 3. 레이어별 역할

### Controller
- HTTP 요청/응답 처리만 담당
- 비즈니스 로직 없음
- `ApiResponse<T>`로 응답 표준화
- `@Valid`로 요청 검증

### Service
- 비즈니스 로직 담당
- 트랜잭션 관리 (`@Transactional`)
- 도메인 간 조합이 필요할 경우 여기서 처리
- Entity를 직접 Controller로 넘기지 않고 DTO로 변환 후 반환

### Repository
- DB 접근만 담당
- Spring Data JPA 기본 메서드 + 필요 시 JPQL / QueryDSL (2차)

### Entity
- DB 테이블 매핑
- 비즈니스 로직은 넣지 않음 (빈약한 도메인 모델 유지)
- `BaseEntity`로 `createdAt` / `updatedAt` 공통 처리

### DTO
- Request: 입력 검증 (`@NotBlank`, `@NotNull` 등)
- Response: Entity 노출 차단, 필요한 필드만 반환
- Entity ↔ DTO 변환은 Service 레이어에서 처리

---

## 4. 도메인 간 의존 관계

```
auth ──────────────────→ user
                          (OAuth2 로그인 시 User 조회/생성)

analysis ──────────────→ note
                          (분석 완료 시 Note 저장)

analysis ──────────────→ blog
                          (Note 저장 후 BlogDraft 저장)

note ───────────────────→ blog
                          (Note 삭제 시 BlogDraft 연쇄 삭제)
```

> **원칙**: 도메인 간 직접 Repository 호출은 금지.
> 다른 도메인의 데이터가 필요하면 해당 도메인의 Service를 통해 접근합니다.

---

## 5. 주요 설계 원칙 요약

- **Entity는 Controller까지 올라오지 않는다** — 항상 DTO로 변환
- **도메인 간 Repository 직접 접근 금지** — Service를 통해서만
- **외부 API 호출은 `client` 패키지로 격리** — analysis, blog 도메인 내부
- **OpenAI 호출은 WebFlux(WebClient) 기반** — 별도 Config 없이 WebClient.Builder 주입
- **공통 관심사는 `global`로** — 예외 처리, 응답 형식, 보안 설정
- **`@Async` 처리는 AnalysisJobProcessor 단독 책임** — AnalysisService는 Job 생성/조회만
