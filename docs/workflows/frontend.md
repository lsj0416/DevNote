# Frontend Workflow

## 현재 목표

프론트엔드 프로젝트를 monorepo 안에서 초기화하고, `docs/frontend-plan.md`를 실제 구현 Step으로 연결할 수 있는 workflow를 유지합니다.

## 현재 상태

- `frontend/`는 Vite + React + TypeScript 기준으로 초기화 완료
- 상세 설계 문서는 [docs/frontend-plan.md](/Users/sejong/Desktop/Project/devnote/docs/frontend-plan.md)에 정리되어 있음
- 백엔드는 monorepo 구조 기준으로 로컬 실행이 가능한 상태
- 프론트 운영 문서는 이 workflow에서 Step 기준으로 관리 시작

## 선행 의존성

- 백엔드 실행 기준과 인증/API 흐름이 크게 변하지 않아야 합니다.
- frontend 구현은 [docs/frontend-plan.md](/Users/sejong/Desktop/Project/devnote/docs/frontend-plan.md)를 상세 설계 기준으로 사용합니다.
- 로컬 개발 기준은 backend `8080`, Redis `6380`, PostgreSQL `5432`를 전제로 합니다.

## 다음 우선 Step

디자인 정교화 또는 설정 화면 확장

## Step 1. Frontend 프로젝트 초기화

- 상태: `Done`
- 목표: monorepo 안에서 React 기반 프론트엔드 프로젝트 기본 골격을 생성합니다.
- 선행 조건: monorepo 문서 구조와 backend 실행 기준이 안정적이어야 합니다.
- 작업 범위: 프로젝트 생성, package manager 결정, 기본 디렉토리 구조, README 반영
- 관련 문서/파일: `frontend/README.md`, `docs/frontend-plan.md`
- 작업 지시: React + TypeScript + Vite 기준 기본 앱을 초기화하고, 이후 Step이 이어질 최소 구조를 준비합니다.
- 검증 방법: 설치 후 개발 서버 실행 가능 여부 확인
- 완료 조건: `frontend/`에서 개발 서버가 실행되고, 기본 구조가 계획안과 크게 어긋나지 않습니다.
- 다음 Step 진입 조건: 라우팅과 레이아웃 뼈대를 얹을 수 있는 프로젝트 기반이 준비되어야 합니다.
- 결정 사항: package manager는 monorepo 로컬 개발 기준으로 `npm`을 사용합니다.
- 작업 결과: `frontend/`에 Vite + React + TypeScript 앱을 초기화했고 `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared` 구조를 준비했습니다.
- 검증 결과: 초기화 이후 `npm install`, `npm run build`, `npm run dev -- --host 127.0.0.1` 기준으로 설치, 프로덕션 빌드, 개발 서버 기동을 확인했습니다.
- 다음 세션의 첫 행동: `react-router-dom`을 추가하고 `/`, `/app`, `/login/callback` 라우트 골격을 생성합니다.

## Step 2. 라우팅/레이아웃 뼈대 구성

- 상태: `Done`
- 목표: 공개 영역과 보호 영역을 나누는 기본 라우팅 구조를 만듭니다.
- 선행 조건: frontend 앱이 초기화되어 있어야 합니다.
- 작업 범위: 라우터 설정, `/`, `/app`, 공통 레이아웃, 보호 라우트 기초
- 관련 문서/파일: `docs/frontend-plan.md`, frontend 라우팅 관련 파일
- 작업 지시: 랜딩/앱 내부 흐름을 나누고, 이후 화면을 꽂아 넣을 레이아웃 구조를 먼저 만듭니다.
- 검증 방법: 주요 경로 진입과 기본 화면 전환 확인
- 완료 조건: 페이지 골격과 네비게이션 구조가 잡혀 있습니다.
- 다음 Step 진입 조건: 인증 흐름을 라우팅 안에 자연스럽게 연결할 수 있어야 합니다.
- 작업 결과: `react-router-dom`을 추가했고 공개 레이아웃, 보호 레이아웃, `RequireAuth`, placeholder 페이지들을 `/`, `/login/callback`, `/app/*` 구조로 연결했습니다.
- 결정 사항: 보호 라우트는 Step 2에서는 `localStorage`의 `devnote.accessToken` 존재 여부만 검사하는 임시 가드로 둡니다.
- 검증 결과: 빌드와 주요 경로 렌더링 기준으로 라우터 구성이 깨지지 않아야 합니다.
- 다음 세션의 첫 행동: OAuth 시작 버튼과 callback 페이지를 백엔드 인증 흐름에 연결합니다.

## Step 3. 인증 진입 및 콜백 처리

- 상태: `Done`
- 목표: GitHub 로그인 진입과 콜백 처리 흐름을 프론트에서 받아낼 수 있게 합니다.
- 선행 조건: 기본 라우팅과 앱 상태 저장 구조가 있어야 합니다.
- 작업 범위: 로그인 CTA, callback 페이지, 사용자 prefetch, 토큰 처리
- 관련 문서/파일: `docs/frontend-plan.md`, `docs/api.md`, backend auth 관련 문서
- 작업 지시: 인증 세션 시작과 로그인 후 앱 진입 흐름을 정리합니다.
- 검증 방법: 로그인 진입 URL과 callback 처리 분기 확인
- 완료 조건: 인증 흐름을 프론트 기준으로 설명하고 구현할 수 있습니다.
- 다음 Step 진입 조건: 로그인 후 대시보드 접근이 가능해야 합니다.
- 작업 결과: 랜딩의 로그인 CTA를 백엔드 `/oauth2/authorization/github`로 연결했고, `/login/callback`에서 `accessToken`, `refreshToken`, `error` 쿼리를 처리해 세션 저장과 `/users/me` prefetch 후 `/app`으로 이동하도록 구현했습니다.
- 결정 사항: 인증 상태는 Step 3에서는 `localStorage`에 access token, refresh token, 사용자 정보를 저장하는 단순 세션 방식으로 관리합니다.
- 검증 결과: `npm run build`와 `npm run dev -- --host 127.0.0.1` 기준으로 콜백 라우트와 보호 라우트 구성이 깨지지 않아야 합니다.
- 다음 세션의 첫 행동: `/app` 대시보드에 repo URL 입력 폼과 분석 요청 API 호출을 연결합니다.

## Step 4. 대시보드 repo 입력 흐름

- 상태: `Done`
- 목표: repo URL 입력과 분석 요청의 첫 사용자 액션을 구현합니다.
- 선행 조건: 인증 이후 보호 영역 접근이 가능해야 합니다.
- 작업 범위: 입력 폼, URL 검증, 요청 제출, 성공 시 job 상태 페이지 이동
- 관련 문서/파일: `docs/frontend-plan.md`, `docs/api.md`
- 작업 지시: 가장 중요한 입력 경험을 먼저 완성합니다.
- 검증 방법: 유효/무효 URL 입력, 요청 후 화면 이동 확인
- 완료 조건: 사용자가 분석 요청을 보낼 수 있습니다.
- 다음 Step 진입 조건: `jobId`를 받아 polling 화면으로 연결되어야 합니다.
- 작업 결과: `/app` 대시보드에 repo URL 입력 폼과 GitHub URL 검증을 추가했고, `POST /api/v1/analysis` 호출 성공 시 `/app/analysis/:jobId`로 이동하도록 구현했습니다.
- 결정 사항: Step 4에서는 최근 분석/노트 영역은 placeholder로 유지하고, 핵심 입력 플로우를 우선 연결합니다.
- 검증 결과: `npm run build`, `npm run dev -- --host localhost` 기준으로 빌드와 localhost 개발 서버 기동을 확인했습니다.
- 다음 세션의 첫 행동: `/app/analysis/:jobId`에서 상태 polling과 완료/실패 분기를 구현합니다.

## Step 5. Analysis polling 화면

- 상태: `Done`
- 목표: 비동기 분석 Job 상태를 안정적으로 보여주는 화면을 구현합니다.
- 선행 조건: 분석 요청 후 `jobId`를 받을 수 있어야 합니다.
- 작업 범위: polling 훅, 상태 메시지, 완료 시 note 이동, 실패 처리
- 관련 문서/파일: `docs/frontend-plan.md`, `docs/api.md`, backend analysis 관련 구현
- 작업 지시: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` 상태 전이를 사용자 친화적으로 표현합니다.
- 검증 방법: 상태별 화면과 polling 중단 조건 확인
- 완료 조건: analysis 흐름의 핵심 UX가 구현됩니다.
- 다음 Step 진입 조건: 완료 시 note 화면으로 자연스럽게 연결되어야 합니다.
- 작업 결과: `/app/analysis/:jobId`에서 `GET /api/v1/analysis/{jobId}` polling을 연결했고, 상태별 메시지, 실패 안내, 완료 시 `noteId` 기준 노트 상세 페이지 자동 이동을 구현했습니다.
- 결정 사항: polling 주기는 2.5초로 두고 `COMPLETED`, `FAILED` 상태에서는 즉시 polling을 중단합니다.
- 검증 결과: `npm run build` 기준으로 타입/번들 검증을 통과했고, localhost 개발 서버에서 상태 페이지 라우트가 기동되어야 합니다.
- 다음 세션의 첫 행동: 노트 목록/상세 API를 연결하고 note 상세 읽기 화면으로 확장합니다.

## Step 6. Notes/Blog 읽기 화면

- 상태: `Done`
- 목표: 생성된 노트와 블로그 초안을 읽는 핵심 소비 화면을 구현합니다.
- 선행 조건: noteId 기준 이동 흐름과 관련 API 구조가 정리되어 있어야 합니다.
- 작업 범위: 노트 목록/상세, 블로그 초안, Markdown 렌더링, export 진입
- 관련 문서/파일: `docs/frontend-plan.md`, `docs/api.md`
- 작업 지시: 카드형 요약과 문서형 본문을 함께 제공하는 읽기 경험을 구현합니다.
- 검증 방법: 목록, 상세, 블로그 초안, export 액션 확인
- 완료 조건: MVP 핵심 사용자 흐름이 end-to-end로 연결됩니다.
- 다음 Step 진입 조건: 이후 개선은 디자인 정교화 또는 설정 화면 확장으로 이어집니다.
- 작업 결과: 노트 목록, 노트 상세, 블로그 초안 페이지를 실제 API와 연결했고 `react-markdown`으로 아키텍처/원문/초안을 렌더링하며 export URL 진입까지 구현했습니다.
- 결정 사항: Step 6에서는 노트 삭제나 설정 수정 같은 보조 액션보다 읽기 흐름과 export 진입을 우선 연결합니다.
- 검증 결과: `npm run build` 기준으로 타입/번들 검증을 통과했고, 기존 localhost 개발 서버가 켜져 있다면 `5173`에서 화면을 확인하면 됩니다.
- 다음 세션의 첫 행동: 디자인 보강 또는 `/app/settings` 실제 기능 연결 중 우선순위를 정해 진행합니다.
