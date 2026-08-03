import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listNotes } from "@/lib/domain/note/note-service";

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { content: notes } = await listNotes(session.user.id, 0, 20);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>내 노트</h1>
      {notes.length === 0 ? (
        <p>아직 생성된 노트가 없습니다.</p>
      ) : (
        <ul>
          {notes.map((note) => (
            <li key={note.id}>
              <Link href={`/notes/${note.id}`}>{note.title}</Link>
              <p>{note.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
