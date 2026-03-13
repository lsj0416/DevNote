# 프롬프트 전략 설계

> v1.0 | 2026.03

---

## 1. 개요

DevNote AI는 OpenAI API를 두 단계로 호출합니다.

| 단계 | 목적 | 모델 |
|------|------|------|
| 1단계 | 학습 노트 생성 | GPT-4o |
| 2단계 | 블로그 초안 생성 | GPT-4o mini |

각 단계는 독립적으로 호출되며, 2단계는 1단계 결과(노트 데이터)를 입력으로 사용합니다.

---

## 2. 입력 데이터 수집 전략

GitHub API를 통해 아래 데이터를 수집합니다.

| 데이터 | GitHub API | 전처리 |
|--------|------------|--------|
| README | `GET /repos/{owner}/{repo}/readme` | Base64 디코딩, 최대 3,000자 truncate |
| 디렉토리 구조 | `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` | depth 3 이하만 추출 |
| repo 메타데이터 | `GET /repos/{owner}/{repo}` | name, description, language, topics, stars |

> ⚠️ MVP에서는 코드 파일 분석 제외 (토큰 비용 및 복잡도 관리)

---

## 3. 1단계 - 학습 노트 생성

### 설정

| 항목 | 값 |
|------|-----|
| 모델 | `gpt-4o` |
| temperature | `0.3` (일관된 구조화 출력) |
| max_tokens | `2000` |
| response_format | `json_object` |

### 시스템 프롬프트

```
You are a developer education assistant.
Analyze the given GitHub repository information and generate a structured learning note in Korean.
Always respond in valid JSON format only. Do not include any explanation outside of JSON.
```

### 유저 프롬프트

```
아래 GitHub repo 정보를 분석해서 개발자 학습 노트를 JSON으로 작성해줘.

[repo 메타데이터]
- 이름: {repoName}
- 설명: {description}
- 주요 언어: {language}
- 토픽: {topics}

[README]
{readme}

[디렉토리 구조]
{directoryTree}

아래 JSON 형식으로만 응답해줘:
{
  "summary": "프로젝트를 1~3문장으로 요약",
  "concepts": ["핵심 개념 키워드 배열"],
  "architecture": "주요 구조 설명 (Markdown 형식)",
  "learningPoints": ["이 repo에서 배울 수 있는 점 배열"],
  "techStack": ["사용된 기술 스택 배열"],
  "difficulty": "BEGINNER 또는 INTERMEDIATE 또는 ADVANCED"
}
```

### 출력 JSON Schema

```json
{
  "summary": "string (1~3문장)",
  "concepts": ["string"],
  "architecture": "string (Markdown)",
  "learningPoints": ["string"],
  "techStack": ["string"],
  "difficulty": "BEGINNER | INTERMEDIATE | ADVANCED"
}
```

---

## 4. 2단계 - 블로그 초안 생성

### 설정

| 항목 | 값 |
|------|-----|
| 모델 | `gpt-4o-mini` |
| temperature | `0.6` (자연스러운 글쓰기) |
| max_tokens | `3000` |
| response_format | `json_object` |

### 시스템 프롬프트

```
You are a technical blog writing assistant.
Write a Korean developer blog post based on the given learning note.
Always respond in valid JSON format only. Do not include any explanation outside of JSON.
```

### 유저 프롬프트

```
아래 학습 노트를 바탕으로 개발자 블로그 포스트 초안을 JSON으로 작성해줘.

[학습 노트]
- 요약: {summary}
- 핵심 개념: {concepts}
- 아키텍처: {architecture}
- 학습 포인트: {learningPoints}
- 기술 스택: {techStack}

블로그 구조는 아래를 따라줘:
1. 서론 (이 프로젝트를 왜 분석했는지)
2. 프로젝트 개요 (summary 기반)
3. 아키텍처 설명 (architecture 기반)
4. 배운 점 (learningPoints 기반)
5. 결론

아래 JSON 형식으로만 응답해줘:
{
  "title": "블로그 포스트 제목",
  "content": "블로그 본문 (Markdown 형식)"
}
```

### 출력 JSON Schema

```json
{
  "title": "string",
  "content": "string (Markdown)"
}
```

---

## 5. 에러 처리 전략

| 상황 | 처리 방법 |
|------|-----------|
| JSON 파싱 실패 | temperature 0으로 재시도 (최대 2회) |
| 토큰 초과 | README를 1,500자로 재truncate 후 재시도 |
| API 타임아웃 | 30초 초과 시 `AI_API_ERROR` (502) 반환 |
| 재시도 모두 실패 | Job status = FAILED, error_message 저장 |

### 재시도 흐름

```
1차 호출 (temperature: 0.3)
  ↓ JSON 파싱 실패
2차 호출 (temperature: 0)
  ↓ JSON 파싱 실패
3차 호출 (temperature: 0, README 1,500자 truncate)
  ↓ 실패
Job FAILED 처리
```

---

## 6. 비용 최적화 전략

**캐싱**
- 동일 repo + 동일 commit SHA 요청 시 AI 재호출 없이 기존 노트 반환
- Redis에 `{repoUrl}:{commitSha}` 키로 noteId 캐싱

**모델 분리**
- 분석 품질이 중요한 노트 생성 → GPT-4o
- 상대적으로 창의적 글쓰기인 블로그 초안 → GPT-4o mini (비용 절감)

**입력 토큰 절감**
- README: 최대 3,000자 truncate
- 디렉토리 구조: depth 3 이하만 포함
- repo 메타데이터: 필요한 필드만 선택적 전달

---

## 7. 향후 개선 방향

| 항목 | 내용 |
|------|------|
| 파일 단위 분석 | 선택 파일 내용을 청킹해서 프롬프트에 포함 |
| Few-shot 예시 추가 | 좋은 노트 예시를 프롬프트에 포함해 품질 향상 |
| 퀴즈 생성 프롬프트 | 학습 노트 기반 퀴즈 문제 자동 생성 (2차) |
| 스트리밍 응답 | OpenAI Streaming API로 실시간 생성 결과 전달 (2차) |
