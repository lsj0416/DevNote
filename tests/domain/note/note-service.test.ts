import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createNoteFromAnalysis } from "@/lib/domain/note/note-service";
import type { GeneratedNote } from "@/lib/domain/note/note-generator";

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

const sampleNote: GeneratedNote = {
  title: "테스트 노트",
  summary: "요약입니다",
  concepts: ["a", "b"],
  architecture: "구조 설명",
  learningPoints: ["포인트1"],
  rawMarkdown: "# 테스트 노트",
};

describe("createNoteFromAnalysis", () => {
  it("persists the note and returns its id", async () => {
    const user = await prisma.user.create({
      data: { githubId: `note-${Date.now()}`, username: "note-tester" },
    });
    createdUserIds.push(user.id);
    const job = await prisma.analysisJob.create({
      data: { userId: user.id, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
    });

    const noteId = await createNoteFromAnalysis(user.id, job.id, sampleNote);

    const saved = await prisma.note.findUniqueOrThrow({ where: { id: noteId } });
    expect(saved.userId).toBe(user.id);
    expect(saved.jobId).toBe(job.id);
    expect(saved.title).toBe("테스트 노트");
    expect(saved.concepts).toEqual(["a", "b"]);
    expect(saved.learningPoints).toEqual(["포인트1"]);
  });
});
