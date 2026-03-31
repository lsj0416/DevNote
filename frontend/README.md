# DevNote Frontend

> DevNote의 사용자 UI를 담당하는 React 클라이언트

## Status

프론트엔드는 아직 초기화 전입니다. 현재는 구조와 구현 방향을 먼저 정의한 상태입니다.

기획 문서는 [docs/frontend-plan.md](/Users/sejong/Desktop/Project/devnote/docs/frontend-plan.md)를 참고하세요.

## Planned Responsibilities

- GitHub 로그인 진입 및 콜백 처리
- repo URL 입력과 분석 요청
- 분석 Job polling 상태 표시
- 학습 노트 목록 / 상세 조회
- 블로그 초안 조회 및 export
- 계정 설정 화면 제공

## Planned Stack

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand 또는 Context API
- react-hook-form
- zod
- react-markdown

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
    app/
    pages/
    widgets/
    features/
    entities/
    shared/
```

## API Integration Notes

- API 서버 기본 경로는 `/api/v1`
- 인증은 JWT 기반
- 분석 요청은 비동기 Job 구조이며 `jobId` polling이 필요
- 분석 완료 후 `noteId`를 기준으로 상세 페이지로 이동

## Next Step

프론트엔드 초기화 시 아래 순서를 권장합니다.

1. Vite + React + TypeScript 프로젝트 생성
2. 라우터 및 보호 라우트 구성
3. API 클라이언트 및 인증 저장소 구성
4. 대시보드와 분석 상태 흐름 구현
5. 노트 / 블로그 읽기 화면 구현
