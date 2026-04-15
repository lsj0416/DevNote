# 프론트엔드 구현 기획안

> 기준 문서: `README.md`, `docs/architecture.md`, `docs/api.md`, `docs/domain.md`, `docs/erd.md`, `docs/prompt.md`
> 범위: MVP 프론트엔드 (React 기반)
> 작성일: 2026-03-30

---

## 1. 기획 목적

DevNote AI의 프론트엔드는 아래 핵심 흐름을 가장 짧고 명확하게 완성하는 것이 목표입니다.

```text
GitHub 로그인
  → repo URL 입력
  → AI 분석 요청
  → 분석 진행 상태 확인
  → 학습 노트 열람
  → 블로그 초안 열람 / export
```

문서 기준 MVP는 "복잡한 협업 기능"보다 "개인 개발자의 학습 자동화 경험"이 더 중요합니다.  
따라서 초반 프론트엔드는 다음 세 가지에 집중해야 합니다.

- 사용자가 바로 이해할 수 있는 단일 핵심 플로우
- 비동기 분석 Job 상태를 불안하지 않게 보여주는 UX
- 생성된 학습 노트와 블로그 초안을 읽기 좋게 소비하는 정보 구조

---

## 2. MVP 제품 해석

백엔드 문서를 바탕으로 정리한 MVP 핵심 기능은 다음과 같습니다.

- GitHub OAuth2 로그인
- 내 정보 조회 / 프로필 수정
- GitHub repo URL 분석 요청
- 분석 Job 상태 polling 조회
- 내 분석 히스토리 조회
- 내 노트 목록 / 상세 조회 / 삭제
- 노트 기반 블로그 초안 조회
- 블로그 Markdown export

프론트엔드에서 특히 중요한 제약은 다음과 같습니다.

- 분석은 동기 응답이 아니라 `jobId` 기반 비동기 polling 구조
- 분석 결과는 최종적으로 `noteId`를 통해 노트 화면으로 이동
- 실패 상태(`FAILED`)와 중복 요청(`DUPLICATE_REQUEST`)을 명확히 처리해야 함
- 노트 데이터는 구조화 JSON + Markdown 혼합 형태이므로 카드형 요약과 문서형 본문을 함께 제공해야 함

---

## 3. 타겟 사용자와 핵심 사용 시나리오

### 타겟 사용자

- GitHub 저장소를 보며 공부하는 주니어/미드 개발자
- 학습 내용을 정리하고 블로그 초안까지 빠르게 만들고 싶은 개인 사용자

### 대표 시나리오

1. 사용자가 랜딩 페이지에서 서비스 가치를 이해한다.
2. GitHub 로그인으로 빠르게 진입한다.
3. 대시보드에서 repo URL을 붙여넣고 분석을 요청한다.
4. 분석 진행 상태를 실시간에 가깝게 확인한다.
5. 완료 후 생성된 학습 노트를 읽는다.
6. 같은 화면 또는 연결 화면에서 블로그 초안을 확인하고 export 한다.
7. 이후에는 저장된 노트 목록에서 다시 복습한다.

---

## 4. 화면 구조(IA)

```text
/                         랜딩 페이지
/login/callback           OAuth 완료 처리 페이지
/app                      대시보드 홈
/app/analysis             분석 히스토리 목록
/app/analysis/:jobId      분석 진행 상태 페이지
/app/notes                노트 목록
/app/notes/:noteId        노트 상세 페이지
/app/notes/:noteId/blog   블로그 초안 페이지
/app/settings             내 정보 / 계정 설정
```

### 라우팅 원칙

- 비로그인 사용자는 `/` 중심 공개 화면만 접근
- 로그인 후 모든 핵심 기능은 `/app/*` 아래 보호 라우트로 구성
- 분석 생성 직후 `jobId` 전용 진행 화면으로 이동
- 분석 완료 시 자동으로 노트 상세 페이지로 리다이렉트

---

## 5. 페이지별 기획

## 5-1. 랜딩 페이지 `/`

목표는 서비스 이해와 로그인 전환입니다.

주요 섹션:

- 히어로: "repo를 넣으면 학습 노트와 블로그 초안이 생성된다"는 핵심 메시지
- 작동 방식 3단계 설명
- 결과물 예시 미리보기
- GitHub 로그인 CTA

주요 UI 요소:

- 서비스 소개 카피
- 예시 노트 카드
- 예시 블로그 Markdown 프리뷰
- GitHub 로그인 버튼

---

## 5-2. OAuth 콜백 페이지 `/login/callback`

역할:

- 서버 리다이렉트 이후 토큰 수신 및 저장
- 로그인 성공/실패 처리
- 최초 진입 시 사용자 정보 prefetch 후 `/app` 이동

예외 처리:

- 토큰 누락
- 만료되었거나 잘못된 토큰
- 사용자 정보 조회 실패

---

## 5-3. 대시보드 홈 `/app`

가장 중요한 생산 화면입니다.

핵심 목표:

- repo URL 입력을 가장 먼저 보이게 배치
- 최근 분석 결과와 최근 노트를 한눈에 보여주기

섹션 제안:

- 상단 입력 패널: repo URL 입력 + 분석 시작 버튼
- 최근 분석 Job 목록
- 최근 생성된 노트 목록
- 실패한 Job 재확인 안내

입력 UX 제안:

- GitHub URL 형식 실시간 검증
- 제출 시 버튼 비활성화 + 로딩 상태 표시
- 성공 시 즉시 `/app/analysis/:jobId` 이동

---

## 5-4. 분석 진행 페이지 `/app/analysis/:jobId`

문서상 비동기 Job 구조가 핵심이므로 별도 화면이 필요합니다.

표시 정보:

- repo URL
- 현재 상태: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- 요청 시각
- 실패 시 에러 메시지

UX 원칙:

- 상태별 메시지 문구를 분리
- 2~3초 간격 polling
- 완료 시 자동 이동 전에 "노트가 준비되었습니다" 피드백 제공
- 실패 시 다시 대시보드로 돌아가 재요청 가능하게 안내

상태별 표현:

- `PENDING`: 대기열 등록 완료
- `PROCESSING`: GitHub 분석/AI 생성 진행 중
- `COMPLETED`: 노트 생성 완료, 상세 페이지로 이동
- `FAILED`: 실패 원인 노출 + 재시도 CTA

---

## 5-5. 노트 목록 페이지 `/app/notes`

목표:

- 저장된 학습 노트를 검색 없이도 빠르게 스캔 가능하게 제공

카드 항목:

- 제목
- summary
- 생성일
- 원본 repo 정보가 있으면 함께 노출

상호작용:

- 카드 클릭 시 상세 이동
- 삭제 액션
- 빈 상태에서는 "첫 repo를 분석해보세요" CTA

추가 고려:

- MVP에는 서버 검색 API가 없으므로 클라이언트 로컬 필터 정도만 선택 적용

---

## 5-6. 노트 상세 페이지 `/app/notes/:noteId`

가장 가치가 드러나는 핵심 읽기 화면입니다.

레이아웃 제안:

- 상단 헤더: 제목, 생성일, 관련 액션
- 요약 섹션
- 핵심 개념 태그 섹션
- 아키텍처 설명 섹션
- 학습 포인트 섹션
- 전체 Markdown 원문 섹션
- 블로그 초안 보러가기 CTA

표현 방식:

- `summary`: 강조 카드
- `concepts`: 태그/칩 UI
- `architecture`: Markdown 렌더링
- `learningPoints`: 체크리스트형 리스트
- `rawMarkdown`: 전체 문서 뷰어

핵심 액션:

- 블로그 초안 보기
- 노트 삭제

---

## 5-7. 블로그 초안 페이지 `/app/notes/:noteId/blog`

목표:

- 학습 노트에서 블로그 초안으로 이어지는 가치를 명확히 보여주기

주요 구성:

- 제목
- Markdown 본문 렌더링
- export 버튼
- export URL 생성 후 복사/새 탭 열기 지원

상태 처리:

- 초안 로딩
- export 진행 중
- export 완료
- export 실패

---

## 5-8. 설정 페이지 `/app/settings`

최소 범위:

- 내 정보 조회
- username 수정
- 로그아웃
- 회원 탈퇴

주의점:

- 파괴적 액션은 모달로 한 번 더 확인

---

## 6. 공통 UX 원칙

### 6-1. 정보 구조 원칙

- 쓰기보다 읽기 중심 UI
- 한 화면에 하나의 주요 행동만 강조
- AI 생성 결과는 "짧은 요약 → 구조화 정보 → 전체 원문" 순으로 배치

### 6-2. 로딩 / 빈 상태 / 에러 상태

- 로딩: skeleton 또는 단계형 메시지
- 빈 상태: 다음 행동을 제안하는 CTA 포함
- 에러: 기술 메시지 원문 그대로보다 사용자 친화 문구 우선

### 6-3. 비동기 작업 UX

- 분석 요청 직후 사용자가 "잘 접수되었는지" 바로 알 수 있어야 함
- polling 중에는 불필요한 수동 새로고침을 요구하지 않음
- 실패 시 원인과 다음 행동을 함께 보여줌

---

## 7. 프론트엔드 기술 제안

MVP 기준 권장 스택:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand 또는 Context API
- `react-hook-form` + `zod`
- `react-markdown`
- `axios` 또는 `fetch` 래퍼

선정 이유:

- API 서버와 분리된 React SPA 구조에 적합
- TanStack Query가 polling, 캐싱, 재요청 제어에 유리
- 폼 검증과 토큰/사용자 상태 관리가 단순함

---

## 8. 프론트엔드 폴더 구조 제안

```text
src/
  app/
    router/
    providers/
  pages/
    landing/
    auth/
    dashboard/
    analysis/
    notes/
    blog/
    settings/
  widgets/
    header/
    sidebar/
    repo-input/
    note-card/
    job-status/
  features/
    auth/
    analysis/
    note/
    blog/
    user/
  entities/
    user/
    analysis-job/
    note/
    blog-draft/
  shared/
    api/
    lib/
    ui/
    config/
    types/
```

원칙:

- 페이지는 조립 중심
- API 호출과 서버 상태는 `features` 또는 `entities`에 모음
- 공통 UI는 `shared/ui`
- 도메인 명칭은 백엔드와 최대한 맞춤

---

## 9. API 연동 설계

### 인증

- 로그인 시작: `GET /oauth2/authorization/github`
- 사용자 조회: `GET /users/me`
- 토큰 재발급: `POST /auth/refresh`
- 로그아웃: `POST /auth/logout`

토큰 전략 제안:

- Access Token: 메모리 저장 우선
- Refresh Token: 보안 요구사항에 따라 `httpOnly cookie` 또는 로컬 저장소 검토 필요

주의:

- 현재 API 문서에는 로그인 성공 후 프론트엔드 redirect URI로 Access Token 반환이라고 되어 있으나, 실제 전달 방식(query/hash/cookie)은 명시가 부족합니다.
- 프론트엔드 구현 전 백엔드와 토큰 전달 계약을 확정해야 합니다.

### 분석

- 분석 요청: `POST /analysis`
- 상태 조회: `GET /analysis/{jobId}`
- 목록 조회: `GET /analysis`

polling 규칙 제안:

- 기본 2500ms 간격
- `COMPLETED` 또는 `FAILED`면 즉시 중단
- 브라우저 탭 비활성 시 polling 간격 완화 가능

### 노트

- 목록: `GET /notes`
- 상세: `GET /notes/{noteId}`
- 삭제: `DELETE /notes/{noteId}`

### 블로그

- 조회: `GET /notes/{noteId}/blog-draft`
- export: `POST /notes/{noteId}/blog-draft/export`

---

## 10. 상태 관리 전략

전역 상태:

- 인증 상태
- 현재 사용자 정보
- UI 전역 토스트 / 모달 상태

서버 상태:

- 분석 Job 목록
- 특정 Job 상태
- 노트 목록 / 상세
- 블로그 초안 / export 상태

분리 원칙:

- 서버에서 오는 데이터는 TanStack Query
- 사용자 세션/토큰 같은 앱 상태만 전역 스토어 사용

---

## 11. 데이터 모델 초안

```ts
type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface User {
  id: number;
  username: string;
  email: string | null;
  profileImage: string | null;
  createdAt?: string;
}

interface AnalysisJob {
  jobId: number;
  repoUrl: string;
  status: JobStatus;
  noteId?: number;
  errorMessage?: string;
  createdAt?: string;
}

interface Note {
  noteId: number;
  title: string;
  summary: string;
  concepts?: string[];
  architecture?: string;
  learningPoints?: string[];
  rawMarkdown?: string;
  createdAt: string;
}

interface BlogDraft {
  draftId: number;
  noteId: number;
  title: string;
  content: string;
  exportUrl: string | null;
  createdAt: string;
}
```

---

## 12. 디자인 방향 제안

DevNote AI는 "생산성 툴"이면서 동시에 "학습 리딩 도구"입니다.  
따라서 지나치게 대시보드형 관리 화면으로만 가기보다 "문서를 읽는 경험"이 살아 있어야 합니다.

디자인 키워드:

- calm
- editorial
- focused
- technical

비주얼 방향:

- 랜딩은 명확한 메시지 중심
- 앱 내부는 문서 리더 + 작업 패널 혼합형 레이아웃
- 노트/블로그 본문은 가독성 높은 타이포그래피 우선
- 상태 배지는 명확하되 과한 색 사용은 지양

---

## 13. 우선순위별 개발 단계

### Phase 1. 앱 골격

- 라우팅
- 보호 라우트
- API 클라이언트
- 인증 저장소
- 공통 레이아웃

### Phase 2. 로그인 및 대시보드

- 랜딩 페이지
- GitHub 로그인 연결
- OAuth 콜백 처리
- 대시보드 repo 입력 폼

### Phase 3. 분석 상태 흐름

- 분석 요청
- Job polling
- 상태 페이지
- 완료 시 노트 상세 이동

### Phase 4. 결과 소비 화면

- 노트 목록
- 노트 상세
- 블로그 초안
- Markdown export

### Phase 5. 계정 관리 및 안정화

- 설정 페이지
- 로그아웃 / 회원 탈퇴
- 에러 처리 정교화
- empty/loading UX 보강

---

## 14. 구현 체크리스트

- GitHub 로그인 진입과 콜백 처리 방식 확정
- 토큰 저장 방식 확정
- 공통 API 응답 래퍼 파싱 유틸 구현
- 401 발생 시 refresh 재시도 정책 정의
- 분석 polling 훅 구현
- Markdown 렌더링 컴포넌트 구현
- 노트/블로그 페이지 skeleton 설계
- 삭제/탈퇴 확인 모달 구현
- 에러 코드별 사용자 메시지 매핑 정의

---

## 15. 백엔드와 사전 합의가 필요한 항목

- OAuth 성공 후 토큰 전달 방식
- Refresh Token 저장 위치와 보안 정책
- 분석 완료 시 캐시 히트인 경우도 새 `jobId`를 반환하는지 여부
- 블로그 초안이 분석 완료와 동시에 항상 생성되는지 여부
- 노트 목록/분석 목록 정렬 기준
- 페이지네이션 응답 구조의 최종 고정 여부

---

## 16. 결론

DevNote AI 프론트엔드 MVP는 "많은 기능"보다 "한 번의 repo 입력으로 학습 결과를 얻는 경험"을 매끄럽게 만드는 것이 핵심입니다.

가장 중요한 구현 포인트는 아래 세 가지입니다.

- 로그인 후 바로 분석을 시작할 수 있는 대시보드
- 비동기 Job polling을 신뢰감 있게 보여주는 진행 화면
- AI 생성 결과를 읽기 좋은 노트/블로그 문서 화면

이 구조로 시작하면 현재 백엔드 문서 범위를 무리 없이 수용하면서, 2차 기능인 퀴즈/복습 관리도 자연스럽게 확장할 수 있습니다.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 4 proposals, 3 accepted, 1 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **UNRESOLVED:** 0
- **VERDICT:** CEO CLEARED — eng review required. UI scope is large enough that design review is also recommended.
