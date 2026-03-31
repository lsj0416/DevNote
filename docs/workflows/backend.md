# Backend Workflow

## 현재 목표

monorepo 전환 이후 백엔드 작업 기준을 안정화하고, 이후 API 점검과 기능 작업을 CLI 세션 단위로 이어갈 수 있는 상태를 유지합니다.

## 현재 상태

- `backend/`, `frontend/`, `infra/` 기준 monorepo 구조로 재배치됨
- 백엔드는 `backend/.env`와 `spring.config.import` 기준으로 실행
- 로컬 Redis 포트는 `6380`으로 조정됨
- 운영 문서 체계는 이제 `ai_context.md` + workflow 문서로 관리 시작

## 다음 우선 Step

Step 1. Monorepo 전환 정리 마무리

## 완료 기준 정의

- 각 Step은 목표, 검증 방법, 다음 진입 조건이 명확해야 합니다.
- 완료된 Step은 `Done`으로 유지하되 10줄 내외로 압축합니다.
- 다음 세션은 문서 상단만 읽고 바로 착수할 수 있어야 합니다.

## Step 1. Monorepo 전환 정리 마무리

- 상태: `Todo`
- 목표: 현재 폴더 재구성과 실행 문서 구성이 충돌 없이 마무리되도록 정리합니다.
- 작업 범위: README/infra/workflow 문서 정리, 경로 기준 점검, `.gitignore`와 실행 기준 확인
- 관련 파일: `README.md`, `backend/README.md`, `infra/README.md`, `.gitignore`
- 작업 지시: monorepo 전환 후 남은 혼란 요소를 정리하고, 루트/백엔드/인프라 문서 기준을 일관되게 맞춥니다.
- 검증 방법: `git status --short`로 구조 변경 상태 확인, `cd backend && ./gradlew bootRun` 가능 여부 확인
- 완료 조건: 문서 기준과 실제 실행 기준이 일치하고, 다음 Step이 백엔드 기능 점검으로 자연스럽게 이어집니다.
- 다음 Step 진입 조건: backend 실행이 안정적이고, monorepo 관련 문서 정리가 끝난 상태
- 작업 후 업데이트 메모: 완료 시 남은 구조 이슈와 다음 세션 첫 행동만 짧게 남깁니다.

## Step 2. Backend 로컬 실행 안정화

- 상태: `Todo`
- 목표: 로컬 환경에서 백엔드가 반복 실행 가능한 상태인지 점검합니다.
- 작업 범위: 포트 충돌, `.env` 로드, Docker Compose 의존성, 부팅 경고 확인
- 관련 파일: `backend/build.gradle`, `backend/src/main/resources/application.yml`, `backend/src/main/resources/application-local.yml`, `infra/docker-compose.yml`
- 작업 지시: 백엔드 실행 실패 원인을 환경 기준에서 먼저 제거하고, 로컬 실행 절차를 재현 가능하게 만듭니다.
- 검증 방법: `docker compose -f infra/docker-compose.yml up -d`, `cd backend && ./gradlew bootRun`
- 완료 조건: 포트/환경변수/인프라 이슈 없이 백엔드가 로컬에서 정상 기동합니다.
- 다음 Step 진입 조건: 인증/보안 설정을 확인할 수 있을 정도로 서버가 안정적으로 떠 있어야 합니다.
- 작업 후 업데이트 메모: 남아 있는 경고가 있으면 기능상 영향 여부만 간단히 기록합니다.

## Step 3. 인증/OAuth 흐름 점검

- 상태: `Todo`
- 목표: GitHub OAuth2, JWT 재발급, 로그아웃 흐름이 현재 문서와 맞는지 점검합니다.
- 작업 범위: 인증 엔드포인트, 보안 설정, redirect URI 계약 확인
- 관련 파일: `backend/src/main/java/com/devnote/domain/auth`, `backend/src/main/java/com/devnote/global/config/SecurityConfig.java`, `docs/api.md`
- 작업 지시: 실제 구현과 문서의 차이가 있는지 정리하고, 프론트 연동에 필요한 계약을 명확히 합니다.
- 검증 방법: 관련 엔드포인트와 설정값 정적 검토, 필요 시 로컬 실행 상태에서 인증 진입점 확인
- 완료 조건: 프론트엔드가 사용할 인증 진입 방식과 토큰 흐름이 설명 가능한 상태
- 다음 Step 진입 조건: 인증 흐름과 보호 라우트 전제가 명확해져야 합니다.
- 작업 후 업데이트 메모: 프론트 연동 시 반드시 알아야 할 계약만 남깁니다.

## Step 4. Analysis API와 Job 흐름 점검

- 상태: `Todo`
- 목표: 분석 요청, polling, 결과 저장 흐름이 현재 구현과 문서 기준으로 일치하는지 확인합니다.
- 작업 범위: `/analysis`, Job 상태, note 연결, 실패 처리
- 관련 파일: `backend/src/main/java/com/devnote/domain/analysis`, `docs/api.md`, `docs/architecture.md`
- 작업 지시: 프론트엔드 polling 구현에 필요한 응답 구조와 상태 전이를 정리합니다.
- 검증 방법: 컨트롤러/서비스/DTO 점검, 필요 시 API 호출 시나리오 확인
- 완료 조건: 프론트가 `jobId`와 `noteId` 기준으로 구현할 수 있을 정도로 흐름이 정리됨
- 다음 Step 진입 조건: 결과 소비 화면 설계를 위해 note/blog 연결이 명확해야 합니다.
- 작업 후 업데이트 메모: 프론트엔드에 전달할 주의사항만 남깁니다.

## Step 5. 노트/블로그 API 준비 상태 정리

- 상태: `Todo`
- 목표: 노트 상세, 목록, 블로그 초안 조회 및 export API의 준비 상태를 정리합니다.
- 작업 범위: note/blog controller, DTO, 응답 구조, 삭제/export 흐름
- 관련 파일: `backend/src/main/java/com/devnote/domain/note`, `backend/src/main/java/com/devnote/domain/blog`, `docs/api.md`
- 작업 지시: 프론트엔드 읽기 화면 구현 전에 필요한 응답 형식과 비어 있는 부분을 확인합니다.
- 검증 방법: 코드/문서 비교, 필요 시 로컬 확인
- 완료 조건: 프론트엔드 화면 구현에 필요한 API 상태가 정리됨
- 다음 Step 진입 조건: frontend workflow의 상세 화면 구현으로 자연스럽게 연결 가능해야 합니다.
- 작업 후 업데이트 메모: 화면 연동 시 필요한 제약만 남깁니다.

