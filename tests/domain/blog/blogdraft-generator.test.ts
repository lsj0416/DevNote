import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NoteForBlogDraft } from "@/lib/domain/blog/blogdraft-generator";

const createCompletion = vi.fn();

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function MockOpenAI() {
    return {
      chat: {
        completions: {
          create: createCompletion,
        },
      },
    };
  }),
}));

const sampleNote: NoteForBlogDraft = {
  title: "Next.js 학습 노트",
  summary: "요약",
  concepts: ["App Router", "Server Components"],
  architecture: "모노레포",
  learningPoints: ["파일 기반 라우팅"],
  rawMarkdown: "# Next.js\n내용",
};

const validDraftJson = { title: "블로그 제목", content: "# 블로그 본문\n..." };

function mockCompletion(content: string) {
  createCompletion.mockResolvedValue({ choices: [{ message: { content } }] });
}

beforeEach(() => {
  createCompletion.mockReset();
});

describe("generateBlogDraft", () => {
  it("returns the parsed draft on a valid JSON response", async () => {
    mockCompletion(JSON.stringify(validDraftJson));
    const { generateBlogDraft } = await import("@/lib/domain/blog/blogdraft-generator");

    const draft = await generateBlogDraft(sampleNote);

    expect(draft).toEqual(validDraftJson);
  });

  it("truncates very long rawMarkdown in the prompt", async () => {
    mockCompletion(JSON.stringify(validDraftJson));
    const { generateBlogDraft } = await import("@/lib/domain/blog/blogdraft-generator");

    await generateBlogDraft({ ...sampleNote, rawMarkdown: "x".repeat(10000) });

    const promptContent = createCompletion.mock.calls[0][0].messages[1].content;
    expect(promptContent.length).toBeLessThan(6000);
    expect(promptContent).toContain("(생략)");
  });

  it("throws BlogDraftGenerationError when the OpenAI call fails", async () => {
    createCompletion.mockRejectedValue(new Error("network error"));
    const { generateBlogDraft, BlogDraftGenerationError } = await import(
      "@/lib/domain/blog/blogdraft-generator"
    );

    await expect(generateBlogDraft(sampleNote)).rejects.toBeInstanceOf(BlogDraftGenerationError);
  });

  it("throws BlogDraftGenerationError when the response is not valid JSON", async () => {
    mockCompletion("not json");
    const { generateBlogDraft, BlogDraftGenerationError } = await import(
      "@/lib/domain/blog/blogdraft-generator"
    );

    await expect(generateBlogDraft(sampleNote)).rejects.toBeInstanceOf(BlogDraftGenerationError);
  });

  it("throws BlogDraftGenerationError when the JSON doesn't match the schema", async () => {
    mockCompletion(JSON.stringify({ foo: "bar" }));
    const { generateBlogDraft, BlogDraftGenerationError } = await import(
      "@/lib/domain/blog/blogdraft-generator"
    );

    await expect(generateBlogDraft(sampleNote)).rejects.toBeInstanceOf(BlogDraftGenerationError);
  });
});
