# DevNote Frontend

> DevNote의 사용자 UI를 담당하는 React 클라이언트

## Status

Vite + React + TypeScript 기반 초기화가 완료된 상태입니다. Step 1 기준으로 실행 가능한 최소 앱과 디렉토리 뼈대가 준비되어 있습니다.

기획 문서는 [docs/frontend-plan.md](/Users/sejong/Desktop/Project/devnote/docs/frontend-plan.md)를 참고하세요.

## Planned Responsibilities

- GitHub 로그인 진입 및 콜백 처리
- repo URL 입력과 분석 요청
- 분석 Job polling 상태 표시
- 학습 노트 목록 / 상세 조회
- 블로그 초안 조회 및 export
- 계정 설정 화면 제공

## Stack

- React 19
- TypeScript
- Vite 8
- React Router
- TanStack Query
- Zustand 또는 Context API
- react-hook-form
- zod
- react-markdown

## Package Manager

- `npm`

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

기본 개발 서버는 Vite 기본값을 사용하며 로컬에서 `5173` 포트로 실행됩니다.

## Planned Routes

```text
/                         랜딩 페이지
/login/callback           OAuth 콜백 처리
/app                      대시보드
/app/analysis/:jobId      분석 상태 페이지
/app/notes                노트 목록
/app/notes/:noteId        노트 상세
/app/notes/:noteId/blog   블로그 초안
/app/settings             계정 설정
```

## Planned Structure

```text
frontend/
  src/
    app/        앱 진입점과 전역 구성
    pages/      라우트 단위 화면
    widgets/    페이지 조합 컴포넌트
    features/   사용자 액션 단위 기능
    entities/   도메인 표현 모델
    shared/     공용 스타일/유틸/상수
```

## API Integration Notes

- API 서버 기본 경로는 `/api/v1`
- 인증은 JWT 기반
- 분석 요청은 비동기 Job 구조이며 `jobId` polling이 필요
- 분석 완료 후 `noteId`를 기준으로 상세 페이지로 이동

## Next Step

다음 작업은 workflow 기준 디자인 정교화 또는 설정 화면 확장입니다.

1. 노트/블로그 화면의 시각적 완성도 보강
2. Settings 화면과 사용자 정보 수정 연결
3. 필요 시 분석 히스토리 목록 구체화
