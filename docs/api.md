# API 명세

> v1.0 | 2026.03

---

## 1. 공통 사항

| 항목 | 내용 |
|------|------|
| Base URL | `https://devnote.io/api/v1` (예정) |
| 로컬 URL | `http://localhost:8080/api/v1` |
| 인증 방식 | Bearer JWT (Authorization 헤더) |
| 요청 형식 | `application/json` |
| 응답 형식 | `application/json` (camelCase) |

### 공통 응답 형식

**성공**
```json
{
  "success": true,
  "data": { },
  "message": "OK"
}
```

**실패**
```json
{
  "success": false,
  "message": "에러 메시지",
  "code": "ERROR_CODE"
}
```

### 공통 에러 코드

| HTTP Status | code | 설명 |
|-------------|------|------|
| 400 | `INVALID_REQUEST` | 요청 파라미터 오류 |
| 401 | `UNAUTHORIZED` | 인증 필요 |
| 401 | `TOKEN_EXPIRED` | Access Token 만료 |
| 401 | `INVALID_TOKEN` | 유효하지 않은 토큰 |
| 401 | `REFRESH_TOKEN_NOT_FOUND` | Refresh Token 없음 |
| 403 | `FORBIDDEN` | 접근 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `DUPLICATE_REQUEST` | 중복 요청 |
| 429 | `RATE_LIMIT_EXCEEDED` | 요청 한도 초과 |
| 502 | `GITHUB_API_ERROR` | GitHub API 호출 실패 |
| 502 | `AI_API_ERROR` | OpenAI API 호출 실패 |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |

---

## 2. Auth

### GitHub OAuth2 로그인 시작
```
GET /oauth2/authorization/github
```
GitHub 로그인 페이지로 리다이렉트합니다. 로그인 성공 시 프론트엔드 redirect URI로 Access Token을 반환합니다.

| 항목 | 내용 |
|------|------|
| 인증 | 불필요 |
| 응답 | GitHub 로그인 페이지 리다이렉트 |

---

### Access Token 재발급
```
POST /auth/refresh
```

Refresh Token으로 Access Token을 재발급합니다.

| 항목 | 내용 |
|------|------|
| 인증 | 불필요 |

**Request Body**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci..."
  },
  "message": "OK"
}
```

---

### 로그아웃
```
POST /auth/logout
```

Redis에서 Refresh Token을 삭제합니다.

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Request Body**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response**
```json
{
  "success": true,
  "message": "OK"
}
```

---

## 3. Users

### 내 정보 조회
```
GET /users/me
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "lsj0416",
    "email": "lsj0416@github.com",
    "profileImage": "https://avatars.githubusercontent.com/...",
    "createdAt": "2026-03-01T12:00:00"
  },
  "message": "OK"
}
```

---

### 내 정보 수정
```
PATCH /users/me
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Request Body**
```json
{
  "username": "새닉네임"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "새닉네임",
    "email": "lsj0416@github.com",
    "profileImage": "https://avatars.githubusercontent.com/..."
  },
  "message": "OK"
}
```

---

### 회원 탈퇴
```
DELETE /users/me
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Response**
```json
{
  "success": true,
  "message": "OK"
}
```

---

## 4. Analysis

### 분석 요청
```
POST /analysis
```

GitHub repo URL을 입력해 AI 분석 Job을 생성합니다. 분석은 비동기로 처리됩니다.

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Request Body**
```json
{
  "repoUrl": "https://github.com/lsj0416/devnote"
}
```

**Response** `202 Accepted`
```json
{
  "success": true,
  "data": {
    "jobId": 1,
    "status": "PENDING",
    "repoUrl": "https://github.com/lsj0416/devnote",
    "createdAt": "2026-03-01T12:00:00"
  },
  "message": "OK"
}
```

**에러 케이스**

| 상황 | code |
|------|------|
| 유효하지 않은 GitHub URL | `INVALID_REQUEST` |
| 이미 진행 중인 분석 요청 존재 | `DUPLICATE_REQUEST` |
| 일일 요청 한도 초과 | `RATE_LIMIT_EXCEEDED` |

---

### 분석 상태 조회 (Polling)
```
GET /analysis/{jobId}
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Response (진행 중)**
```json
{
  "success": true,
  "data": {
    "jobId": 1,
    "status": "PROCESSING",
    "repoUrl": "https://github.com/lsj0416/devnote"
  },
  "message": "OK"
}
```

**Response (완료)**
```json
{
  "success": true,
  "data": {
    "jobId": 1,
    "status": "COMPLETED",
    "repoUrl": "https://github.com/lsj0416/devnote",
    "noteId": 1
  },
  "message": "OK"
}
```

**Response (실패)**
```json
{
  "success": true,
  "data": {
    "jobId": 1,
    "status": "FAILED",
    "errorMessage": "GitHub API 호출에 실패했습니다"
  },
  "message": "OK"
}
```

---

### 내 분석 목록 조회
```
GET /analysis
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |
| Query Params | `page` (default: 0), `size` (default: 10) |

**Response**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "jobId": 1,
        "repoUrl": "https://github.com/lsj0416/devnote",
        "status": "COMPLETED",
        "createdAt": "2026-03-01T12:00:00"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "currentPage": 0
  },
  "message": "OK"
}
```

---

## 5. Notes

### 내 노트 목록 조회
```
GET /notes
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |
| Query Params | `page` (default: 0), `size` (default: 10) |

**Response**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "noteId": 1,
        "title": "devnote 학습 노트",
        "summary": "AI 기반 개발자 학습 노트 서비스입니다.",
        "createdAt": "2026-03-01T12:00:00"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "currentPage": 0
  },
  "message": "OK"
}
```

---

### 노트 상세 조회
```
GET /notes/{noteId}
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Response**
```json
{
  "success": true,
  "data": {
    "noteId": 1,
    "title": "devnote 학습 노트",
    "summary": "AI 기반 개발자 학습 노트 서비스입니다.",
    "concepts": ["JWT", "OAuth2", "Spring Security"],
    "architecture": "## 아키텍처\n...",
    "learningPoints": ["JWT와 OAuth2의 차이를 이해했다", "..."],
    "rawMarkdown": "# devnote\n...",
    "createdAt": "2026-03-01T12:00:00"
  },
  "message": "OK"
}
```

---

### 노트 삭제
```
DELETE /notes/{noteId}
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Response**
```json
{
  "success": true,
  "message": "OK"
}
```

---

## 6. Blog

### 블로그 초안 조회
```
GET /notes/{noteId}/blog-draft
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Response**
```json
{
  "success": true,
  "data": {
    "draftId": 1,
    "noteId": 1,
    "title": "JWT와 OAuth2를 활용한 인증 시스템 구현기",
    "content": "## 서론\n...",
    "exportUrl": null,
    "createdAt": "2026-03-01T12:00:00"
  },
  "message": "OK"
}
```

---

### 블로그 초안 Markdown export
```
POST /notes/{noteId}/blog-draft/export
```

블로그 초안을 `.md` 파일로 S3에 업로드하고 다운로드 URL을 반환합니다.

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (Bearer JWT) |

**Response**
```json
{
  "success": true,
  "data": {
    "exportUrl": "https://s3.ap-northeast-2.amazonaws.com/devnote/..."
  },
  "message": "OK"
}
```

---

## 7. API 흐름 요약

```
1. GitHub OAuth2 로그인
   GET /oauth2/authorization/github
       ↓ 로그인 성공
   Access Token + Refresh Token 발급

2. repo 분석 요청
   POST /analysis { repoUrl }
       ↓ jobId 반환
   GET /analysis/{jobId} (polling)
       ↓ status: COMPLETED
   noteId 확인

3. 노트 조회
   GET /notes/{noteId}

4. 블로그 초안 조회 및 export
   GET /notes/{noteId}/blog-draft
   POST /notes/{noteId}/blog-draft/export
```
