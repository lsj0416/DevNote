import OpenAI from "openai";

const MODEL = "gpt-4o";

export class NoteGenerationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "NoteGenerationError";
  }
}

export interface CollectedCommit {
  sha: string;
  message: string;
  authorName: string | null;
  authoredAt: string | null;
}

export interface CollectedPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: string;
}

export interface CollectedRepoData {
  repoName: string;
  readme: string | null;
  topLevelEntries: { path: string; type: string }[];
  commits: CollectedCommit[];
  pullRequests: CollectedPullRequest[];
}

export interface GeneratedNote {
  title: string;
  summary: string;
  concepts: string[];
  architecture: string | null;
  learningPoints: string[];
  rawMarkdown: string;
}

const SYSTEM_PROMPT = `당신은 GitHub 저장소를 분석해 개발자를 위한 학습 노트를 작성하는 어시스턴트입니다.
아래 JSON 스키마에 정확히 맞춰서만 응답하세요 (다른 텍스트 없이 JSON만):
{
  "title": string,          // 노트 제목 (repo 이름 기반, 간결하게)
  "summary": string,        // 저장소가 무엇을 하는지에 대한 요약
  "concepts": string[],     // 핵심 개념/기술 목록
  "architecture": string | null, // 아키텍처 설명 (파악 어려우면 null)
  "learningPoints": string[],    // 학습 포인트 목록
  "rawMarkdown": string     // 위 내용을 종합한 마크다운 전문
}
커밋/PR 데이터가 주어지면, summary 또는 rawMarkdown에 최근 개발 흐름(작업 과정)에 대한
설명을 반드시 포함하세요.`;

function buildPrompt(data: CollectedRepoData): string {
  const sections: string[] = [`# Repo\n${data.repoName}`];

  sections.push(`# README\n${data.readme ?? "(README 없음)"}`);

  const entries = data.topLevelEntries.map((entry) => `- ${entry.path} (${entry.type})`).join("\n");
  sections.push(`# 최상위 디렉토리 구조\n${entries || "(빈 저장소)"}`);

  if (data.commits.length > 0) {
    const commitLines = data.commits
      .map((commit) => `- ${commit.message.split("\n")[0]}`)
      .join("\n");
    sections.push(`# 최근 커밋 (${data.commits.length}개)\n${commitLines}`);
  }

  if (data.pullRequests.length > 0) {
    const prLines = data.pullRequests
      .map((pr) => `- #${pr.number} ${pr.title} (${pr.state})`)
      .join("\n");
    sections.push(`# 관련 PR (${data.pullRequests.length}개)\n${prLines}`);
  }

  return sections.join("\n\n");
}

function isValidGeneratedNote(value: unknown): value is GeneratedNote {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.summary === "string" &&
    Array.isArray(v.concepts) &&
    (typeof v.architecture === "string" || v.architecture === null) &&
    Array.isArray(v.learningPoints) &&
    typeof v.rawMarkdown === "string"
  );
}

/** Generates a structured learning note from collected repo data via OpenAI. */
export async function generateNote(data: CollectedRepoData): Promise<GeneratedNote> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let response;
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(data) },
      ],
    });
  } catch (error) {
    throw new NoteGenerationError("Failed to call OpenAI API for note generation", {
      cause: error,
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new NoteGenerationError("OpenAI response had no content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new NoteGenerationError("Failed to parse OpenAI response as JSON", { cause: error });
  }

  if (!isValidGeneratedNote(parsed)) {
    throw new NoteGenerationError("OpenAI response did not match the expected note schema");
  }

  return parsed;
}
