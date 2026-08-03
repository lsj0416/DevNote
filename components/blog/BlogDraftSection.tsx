import { ExportButton } from "@/components/blog/ExportButton";

export interface BlogDraftSectionProps {
  noteId: string;
  draft: { title: string; content: string } | null;
}

export function BlogDraftSection({ noteId, draft }: BlogDraftSectionProps) {
  return (
    <section>
      <h2>블로그 초안</h2>
      {draft ? (
        <>
          <h3>{draft.title}</h3>
          <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{draft.content}</pre>
          <ExportButton noteId={noteId} />
        </>
      ) : (
        <p>블로그 초안이 아직 생성되지 않았습니다.</p>
      )}
    </section>
  );
}
