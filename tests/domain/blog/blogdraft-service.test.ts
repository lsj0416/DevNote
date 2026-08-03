import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createBlogDraftFromNote } from "@/lib/domain/blog/blogdraft-service";

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

async function makeNote() {
  const user = await prisma.user.create({
    data: { githubId: `blog-${Date.now()}-${Math.random()}`, username: "blog-tester" },
  });
  createdUserIds.push(user.id);
  const job = await prisma.analysisJob.create({
    data: { userId: user.id, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
  });
  const note = await prisma.note.create({
    data: {
      userId: user.id,
      jobId: job.id,
      title: "t",
      summary: "s",
      concepts: [],
      learningPoints: [],
      rawMarkdown: "md",
    },
  });
  return { user, note };
}

describe("createBlogDraftFromNote", () => {
  it("persists the draft and returns its id", async () => {
    const { user, note } = await makeNote();

    const draftId = await createBlogDraftFromNote(user.id, note.id, {
      title: "블로그 제목",
      content: "# 본문",
    });

    const saved = await prisma.blogDraft.findUniqueOrThrow({ where: { id: draftId } });
    expect(saved.noteId).toBe(note.id);
    expect(saved.title).toBe("블로그 제목");
  });

  it("rejects a second draft for the same note (unique noteId)", async () => {
    const { user, note } = await makeNote();
    await createBlogDraftFromNote(user.id, note.id, { title: "first", content: "c1" });

    await expect(
      createBlogDraftFromNote(user.id, note.id, { title: "second", content: "c2" })
    ).rejects.toThrow();
  });
});
