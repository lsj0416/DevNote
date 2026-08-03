import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CollectedRepoData } from "@/lib/domain/note/note-generator";

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

const baseData: CollectedRepoData = {
  repoName: "vercel/next.js",
  readme: "# Next.js\nThe React Framework",
  topLevelEntries: [{ path: "packages", type: "tree" }],
  commits: [],
  pullRequests: [],
};

const validNoteJson = {
  title: "Next.js 학습 노트",
  summary: "요약",
  concepts: ["React", "SSR"],
  architecture: "모노레포 구조",
  learningPoints: ["파일 기반 라우팅"],
  rawMarkdown: "# Next.js 학습 노트\n...",
};

function mockCompletion(content: string) {
  createCompletion.mockResolvedValue({
    choices: [{ message: { content } }],
  });
}

beforeEach(() => {
  createCompletion.mockReset();
});

describe("generateNote", () => {
  it("returns the parsed note on a valid JSON response", async () => {
    mockCompletion(JSON.stringify(validNoteJson));
    const { generateNote } = await import("@/lib/domain/note/note-generator");

    const note = await generateNote(baseData);

    expect(note).toEqual(validNoteJson);
  });

  it("includes commit/PR context in the prompt when present", async () => {
    mockCompletion(JSON.stringify(validNoteJson));
    const { generateNote } = await import("@/lib/domain/note/note-generator");

    await generateNote({
      ...baseData,
      commits: [
        { sha: "abc", message: "fix: bug", authorName: "dev", authoredAt: "2026-01-01" },
      ],
      pullRequests: [{ number: 1, title: "Add feature", body: null, state: "closed" }],
    });

    const promptContent = createCompletion.mock.calls[0][0].messages[1].content;
    expect(promptContent).toContain("최근 커밋");
    expect(promptContent).toContain("fix: bug");
    expect(promptContent).toContain("관련 PR");
    expect(promptContent).toContain("Add feature");
  });

  it("omits commit/PR sections from the prompt when absent", async () => {
    mockCompletion(JSON.stringify(validNoteJson));
    const { generateNote } = await import("@/lib/domain/note/note-generator");

    await generateNote(baseData);

    const promptContent = createCompletion.mock.calls[0][0].messages[1].content;
    expect(promptContent).not.toContain("최근 커밋");
    expect(promptContent).not.toContain("관련 PR");
  });

  it("throws NoteGenerationError when the OpenAI call fails", async () => {
    createCompletion.mockRejectedValue(new Error("network error"));
    const { generateNote, NoteGenerationError } = await import(
      "@/lib/domain/note/note-generator"
    );

    await expect(generateNote(baseData)).rejects.toBeInstanceOf(NoteGenerationError);
  });

  it("throws NoteGenerationError when the response is not valid JSON", async () => {
    mockCompletion("not json at all");
    const { generateNote, NoteGenerationError } = await import(
      "@/lib/domain/note/note-generator"
    );

    await expect(generateNote(baseData)).rejects.toBeInstanceOf(NoteGenerationError);
  });

  it("throws NoteGenerationError when the JSON doesn't match the expected schema", async () => {
    mockCompletion(JSON.stringify({ foo: "bar" }));
    const { generateNote, NoteGenerationError } = await import(
      "@/lib/domain/note/note-generator"
    );

    await expect(generateNote(baseData)).rejects.toBeInstanceOf(NoteGenerationError);
  });
});
