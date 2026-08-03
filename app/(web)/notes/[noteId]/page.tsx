import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNoteById } from "@/lib/domain/note/note-service";
import { getBlogDraftByNoteId } from "@/lib/domain/blog/blogdraft-service";
import { DeleteNoteButton } from "@/components/note/DeleteNoteButton";
import { BlogDraftSection } from "@/components/blog/BlogDraftSection";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { noteId } = await params;
  const note = await getNoteById(noteId);

  if (!note || note.userId !== session.user.id) {
    notFound();
  }

  const concepts = Array.isArray(note.concepts) ? (note.concepts as string[]) : [];
  const learningPoints = Array.isArray(note.learningPoints)
    ? (note.learningPoints as string[])
    : [];
  const blogDraft = await getBlogDraftByNoteId(note.id);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>{note.title}</h1>
      <p>{note.summary}</p>

      <h2>핵심 개념</h2>
      <ul>
        {concepts.map((concept) => (
          <li key={concept}>{concept}</li>
        ))}
      </ul>

      {note.architecture && (
        <>
          <h2>아키텍처</h2>
          <p>{note.architecture}</p>
        </>
      )}

      <h2>학습 포인트</h2>
      <ul>
        {learningPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <h2>전체 노트</h2>
      <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{note.rawMarkdown}</pre>

      <hr style={{ margin: "1.5rem 0" }} />
      <BlogDraftSection
        noteId={note.id}
        draft={blogDraft ? { title: blogDraft.title, content: blogDraft.content } : null}
      />

      <hr style={{ margin: "1.5rem 0" }} />
      <DeleteNoteButton noteId={note.id} />
    </main>
  );
}
