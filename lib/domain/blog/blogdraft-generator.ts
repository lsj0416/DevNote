import OpenAI from "openai";

const MODEL = "gpt-4o";
const MAX_RAW_MARKDOWN_CHARS = 4000;

export class BlogDraftGenerationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "BlogDraftGenerationError";
  }
}

export interface NoteForBlogDraft {
  title: string;
  summary: string;
  concepts: string[];
  architecture: string | null;
  learningPoints: string[];
  rawMarkdown: string;
}

export interface GeneratedBlogDraft {
  title: string;
  content: string;
}

const SYSTEM_PROMPT = `당신은 개발자의 학습 노트를 기반으로 블로그 초안을 작성하는 어시스턴트입니다.
아래 JSON 스키마에 정확히 맞춰서만 응답하세요 (다른 텍스트 없이 JSON만):
{
  "title": string,   // 블로그 글 제목
  "content": string  // 순수 Markdown 형식의 블로그 본문 전문
}
content는 그대로 .md 파일로 export되므로 반드시 유효한 Markdown 텍스트여야 합니다.`;

function buildPrompt(note: NoteForBlogDraft): string {
  const truncatedRawMarkdown =
    note.rawMarkdown.length > MAX_RAW_MARKDOWN_CHARS
      ? `${note.rawMarkdown.slice(0, MAX_RAW_MARKDOWN_CHARS)}\n...(생략)`
      : note.rawMarkdown;

  return [
    `# 노트 제목\n${note.title}`,
    `# 요약\n${note.summary}`,
    `# 핵심 개념\n${note.concepts.join(", ") || "(없음)"}`,
    `# 아키텍처\n${note.architecture ?? "(없음)"}`,
    `# 학습 포인트\n${note.learningPoints.map((p) => `- ${p}`).join("\n") || "(없음)"}`,
    `# 노트 원문\n${truncatedRawMarkdown}`,
  ].join("\n\n");
}

function isValidGeneratedBlogDraft(value: unknown): value is GeneratedBlogDraft {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && typeof v.content === "string";
}

/** Generates a Markdown blog draft from a learning note via OpenAI. */
export async function generateBlogDraft(note: NoteForBlogDraft): Promise<GeneratedBlogDraft> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let response;
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(note) },
      ],
    });
  } catch (error) {
    throw new BlogDraftGenerationError("Failed to call OpenAI API for blog draft generation", {
      cause: error,
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new BlogDraftGenerationError("OpenAI response had no content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new BlogDraftGenerationError("Failed to parse OpenAI response as JSON", {
      cause: error,
    });
  }

  if (!isValidGeneratedBlogDraft(parsed)) {
    throw new BlogDraftGenerationError(
      "OpenAI response did not match the expected blog draft schema"
    );
  }

  return parsed;
}
